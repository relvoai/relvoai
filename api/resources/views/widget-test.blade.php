<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Widget Test — {{ $channelName }}</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #f8fafc; }

        /* Test mode banner */
        .test-banner {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100000;
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 20px;
            background: #0f172a; color: #e2e8f0;
            font-size: 13px; font-weight: 500;
            box-shadow: 0 1px 3px rgba(0,0,0,.15);
        }
        .test-banner .badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: #6366f1; color: #fff;
            padding: 2px 10px; border-radius: 9999px;
            font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px;
        }
        .test-banner .badge::before {
            content: ''; width: 6px; height: 6px;
            background: #a5f3fc; border-radius: 50%;
            animation: pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
        .test-banner .close-btn {
            background: none; border: none; color: #94a3b8; cursor: pointer;
            font-size: 18px; line-height: 1; padding: 4px;
        }
        .test-banner .close-btn:hover { color: #fff; }

        /* Mock website content */
        .mock-site { padding-top: 52px; min-height: 100vh; }

        .mock-nav {
            background: #fff; border-bottom: 1px solid #e2e8f0;
            padding: 16px 40px; display: flex; align-items: center; justify-content: space-between;
        }
        .mock-nav .logo { font-size: 20px; font-weight: 700; color: #0f172a; }
        .mock-nav .nav-links { display: flex; gap: 28px; }
        .mock-nav .nav-links a {
            color: #64748b; text-decoration: none; font-size: 14px; font-weight: 500;
        }

        .mock-hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 80px 40px; text-align: center; color: #fff;
        }
        .mock-hero h1 { font-size: 42px; font-weight: 800; margin-bottom: 16px; }
        .mock-hero p { font-size: 18px; opacity: .85; max-width: 560px; margin: 0 auto 32px; }
        .mock-hero .cta {
            display: inline-block; background: #fff; color: #667eea;
            padding: 12px 32px; border-radius: 8px; font-weight: 600;
            font-size: 15px; text-decoration: none;
        }

        .mock-content { max-width: 960px; margin: 0 auto; padding: 60px 40px; }
        .mock-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
        .mock-card {
            background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
            padding: 28px; text-align: center;
        }
        .mock-card .icon {
            width: 48px; height: 48px; border-radius: 12px;
            margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;
            font-size: 22px;
        }
        .mock-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
        .mock-card p { font-size: 13px; color: #64748b; line-height: 1.5; }

        .mock-section { margin-top: 60px; }
        .mock-section h2 { font-size: 28px; font-weight: 700; text-align: center; margin-bottom: 12px; }
        .mock-section .subtitle { text-align: center; color: #64748b; font-size: 15px; margin-bottom: 40px; }

        .mock-footer {
            border-top: 1px solid #e2e8f0; padding: 32px 40px;
            text-align: center; color: #94a3b8; font-size: 13px; margin-top: 60px;
        }

        @media (max-width: 768px) {
            .mock-cards { grid-template-columns: 1fr; }
            .mock-hero h1 { font-size: 28px; }
            .mock-nav .nav-links { display: none; }
        }
    </style>
</head>
<body>
    <!-- Test Mode Banner -->
    <div class="test-banner" id="testBanner">
        <div style="display:flex;align-items:center;gap:12px;">
            <span class="badge">Test Mode</span>
            <span>Relvo AI Widget Preview — <strong>{{ $channelName }}</strong></span>
        </div>
        <button class="close-btn" onclick="document.getElementById('testBanner').style.display='none'" title="Hide banner">&times;</button>
    </div>

    <!-- Mock Website -->
    <div class="mock-site">
        <nav class="mock-nav">
            <div class="logo">Acme Inc.</div>
            <div class="nav-links">
                <a href="#">Products</a>
                <a href="#">Pricing</a>
                <a href="#">Docs</a>
                <a href="#">Blog</a>
                <a href="#">Contact</a>
            </div>
        </nav>

        <div class="mock-hero">
            <h1>Build something amazing</h1>
            <p>The modern platform for teams who want to move fast without breaking things.</p>
            <a href="#" class="cta">Get Started Free</a>
        </div>

        <div class="mock-content">
            <div class="mock-section">
                <h2>Why teams choose us</h2>
                <p class="subtitle">Everything you need to scale your business, all in one place.</p>
                <div class="mock-cards">
                    <div class="mock-card">
                        <div class="icon" style="background:#ede9fe;">&#9889;</div>
                        <h3>Lightning Fast</h3>
                        <p>Built for speed with edge computing and global CDN distribution.</p>
                    </div>
                    <div class="mock-card">
                        <div class="icon" style="background:#dbeafe;">&#128274;</div>
                        <h3>Enterprise Security</h3>
                        <p>SOC 2 compliant with end-to-end encryption and audit logging.</p>
                    </div>
                    <div class="mock-card">
                        <div class="icon" style="background:#dcfce7;">&#128640;</div>
                        <h3>Scale Infinitely</h3>
                        <p>Auto-scaling infrastructure that grows with your business needs.</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="mock-footer">
            &copy; 2026 Acme Inc. &mdash; This is a test page for your Relvo AI chat widget.
        </div>
    </div>

    <!-- Widget Embed Script -->
    <script>
        window.RelvoSettings = {
            channel_key: '{{ $channelKey }}'
        };
    </script>
    <script src="{{ asset('js/widget.js') }}" defer></script>
</body>
</html>
