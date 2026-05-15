<?php

namespace App\Ai\Services;

use App\Models\Ai\AiKnowledgeChunk;
use App\Models\Ai\AiKnowledgeSource;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Laravel\Ai\Embeddings;
use Smalot\PdfParser\Parser as PdfParser;
use Symfony\Component\DomCrawler\Crawler;
use Throwable;

/**
 * Reads a knowledge source, extracts plain text, chunks it, generates embeddings,
 * and writes ai_knowledge_chunks rows. Re-runs wipe prior chunks for the source first.
 */
class KnowledgeIndexer
{
    /** Target chunk size in characters (~800 tokens at 4 chars/token). */
    public const CHUNK_CHARS = 3200;

    /** Overlap in characters between consecutive chunks (~100 tokens). */
    public const CHUNK_OVERLAP = 400;

    public function index(AiKnowledgeSource $source): void
    {
        $source->update([
            'status' => AiKnowledgeSource::STATUS_PROCESSING,
            'last_error' => null,
        ]);

        try {
            $text = $this->extractText($source);

            if (trim($text) === '') {
                throw new \RuntimeException('Source produced no extractable text.');
            }

            $source->chunks()->delete();

            $chunks = $this->chunk($text);
            $response = Embeddings::for($chunks)->generate();
            $embeddings = $response->embeddings ?? [];

            foreach ($chunks as $i => $content) {
                AiKnowledgeChunk::create([
                    'ai_agent_id' => $source->ai_agent_id,
                    'source_id' => $source->id,
                    'content' => $content,
                    'embedding' => $embeddings[$i] ?? [],
                    'token_count' => (int) ceil(mb_strlen($content) / 4),
                    'position' => $i,
                    'metadata' => [
                        'source_name' => $source->name,
                        'source_type' => $source->type,
                    ],
                ]);
            }

            $source->update([
                'status' => AiKnowledgeSource::STATUS_READY,
                'chunk_count' => count($chunks),
                'token_count' => array_sum(array_map(fn ($c) => (int) ceil(mb_strlen($c) / 4), $chunks)),
                'last_indexed_at' => now(),
            ]);
        } catch (Throwable $e) {
            $source->update([
                'status' => AiKnowledgeSource::STATUS_FAILED,
                'last_error' => Str::limit($e->getMessage(), 500, ''),
            ]);
            throw $e;
        }
    }

    private function extractText(AiKnowledgeSource $source): string
    {
        return match ($source->type) {
            AiKnowledgeSource::TYPE_TEXT => (string) $source->raw_text,
            AiKnowledgeSource::TYPE_PDF => $this->extractPdf($source),
            AiKnowledgeSource::TYPE_URL => $this->extractUrl($source),
            default => throw new \InvalidArgumentException("Unsupported source type: {$source->type}"),
        };
    }

    private function extractPdf(AiKnowledgeSource $source): string
    {
        if (! $source->disk || ! $source->storage_path) {
            throw new \RuntimeException('PDF source is missing disk or storage_path.');
        }

        $disk = Storage::disk($source->disk);
        $absolute = $disk->path($source->storage_path);

        $pdf = (new PdfParser)->parseFile($absolute);

        return (string) $pdf->getText();
    }

    private function extractUrl(AiKnowledgeSource $source): string
    {
        $url = (string) $source->source_url;
        if ($url === '') {
            throw new \RuntimeException('URL source is missing source_url.');
        }

        $html = Http::timeout(15)->get($url)->throw()->body();

        $crawler = new Crawler($html);
        $crawler->filter('script, style, nav, footer, noscript')->each(fn ($node) => $node->getNode(0)->parentNode->removeChild($node->getNode(0)));

        return preg_replace('/\s+/u', ' ', (string) $crawler->text(normalizeWhitespace: true));
    }

    /**
     * Greedy paragraph-aware chunker with overlap.
     *
     * @return array<int, string>
     */
    public function chunk(string $text): array
    {
        $text = trim(preg_replace('/\s+\n/u', "\n", $text) ?? '');
        if ($text === '') {
            return [];
        }

        $paragraphs = preg_split('/\n{2,}/u', $text) ?: [$text];

        $chunks = [];
        $current = '';

        foreach ($paragraphs as $paragraph) {
            $paragraph = trim($paragraph);
            if ($paragraph === '') {
                continue;
            }

            if (mb_strlen($current) + mb_strlen($paragraph) + 2 <= self::CHUNK_CHARS) {
                $current = $current === '' ? $paragraph : $current."\n\n".$paragraph;

                continue;
            }

            if ($current !== '') {
                $chunks[] = $current;
                $current = $this->tail($current, self::CHUNK_OVERLAP)."\n\n".$paragraph;
            } else {
                // Paragraph alone exceeds budget — hard-split it.
                foreach ($this->hardSplit($paragraph) as $piece) {
                    $chunks[] = $piece;
                }
                $current = '';
            }
        }

        if ($current !== '') {
            $chunks[] = $current;
        }

        return $chunks;
    }

    /** @return array<int, string> */
    private function hardSplit(string $text): array
    {
        $out = [];
        $length = mb_strlen($text);
        $i = 0;
        while ($i < $length) {
            $out[] = mb_substr($text, $i, self::CHUNK_CHARS);
            $i += self::CHUNK_CHARS - self::CHUNK_OVERLAP;
        }

        return $out;
    }

    private function tail(string $text, int $chars): string
    {
        return mb_substr($text, max(0, mb_strlen($text) - $chars));
    }
}
