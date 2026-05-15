import { useQuery } from '@tanstack/react-query';
import { client } from '../../core/http/client';
import { ENDPOINTS } from '../../core/http/endpoints';

export interface RatingResource {
    id: string;
    conversation_id: string;
    rating: number;
    comment: string | null;
    customer_name: string;
    agent_name: string;
    created_at: string;
}

export interface RatingSummary {
    average_rating: number;
    csat_score: number;
    total_responses: number;
}

export interface RatingsResponse {
    summary: RatingSummary;
    ratings: RatingResource[];
}

export const ratingKeys = {
    all: ['ratings'] as const,
};

export function useRatings() {
    return useQuery({
        queryKey: ratingKeys.all,
        queryFn: async () => {
            const response = await client.get<RatingsResponse>(ENDPOINTS.ratings.list);
            return response.data;
        },
    });
}
