<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class FuzzySearchService
{
    /**
     * Remove Vietnamese diacritics and convert to lower case ASCII.
     */
    public static function normalizeString(?string $str): string
    {
        if ($str === null || $str === '') {
            return '';
        }

        $unicode = [
            'a' => 'á|à|ả|ã|ạ|ă|ắ|ặ|ằ|ẳ|ẵ|â|ấ|ầ|ẩ|ẫ|ậ',
            'd' => 'đ',
            'e' => 'é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ',
            'i' => 'í|ì|ỉ|ĩ|ị',
            'o' => 'ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ',
            'u' => 'ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự',
            'y' => 'ý|ỳ|ỷ|ỹ|ỵ',
            'A' => 'Á|À|Ả|Ã|Ạ|Ă|Ắ|Ặ|Ằ|Ẳ|Ẵ|Â|Ấ|Ầ|Ẩ|Ẫ|Ậ',
            'D' => 'Đ',
            'E' => 'É|È|Ẻ|Ẽ|Ẹ|Ê|Ế|Ề|Ể|Ễ|Ệ',
            'I' => 'Í|Ì|Ỉ|Ĩ|Ị',
            'O' => 'Ó|Ò|Ỏ|Õ|Ọ|Ô|Ố|Ồ|Ổ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ở|Ỡ|Ợ',
            'U' => 'Ú|Ù|Ủ|Ũ|Ụ|Ư|Ứ|Ừ|Ử|Ữ|Ự',
            'Y' => 'Ý|Ỳ|Ỷ|Ỹ|Ỵ',
        ];

        foreach ($unicode as $nonUnicode => $uni) {
            $str = preg_replace("/($uni)/i", $nonUnicode, $str);
        }

        return mb_strtolower(trim($str), 'UTF-8');
    }

    /**
     * Compute similarity percentage between search query and target text.
     */
    public static function computeSimilarity(string $query, ?string $text): float
    {
        if ($text === null || $text === '') {
            return 0.0;
        }

        $normQuery = self::normalizeString($query);
        $normText = self::normalizeString($text);

        if ($normQuery === '' || $normText === '') {
            return 0.0;
        }

        // Exact match
        if ($normQuery === $normText) {
            return 100.0;
        }

        // Contains full query as substring
        if (str_contains($normText, $normQuery)) {
            $lenRatio = strlen($normQuery) / max(strlen($normText), 1);

            return 80.0 + ($lenRatio * 20.0);
        }

        // Word match score
        $queryWords = explode(' ', $normQuery);
        $textWords = explode(' ', $normText);
        $matchedWords = 0;
        foreach ($queryWords as $qw) {
            if ($qw !== '' && str_contains($normText, $qw)) {
                $matchedWords++;
            }
        }
        $wordScore = count($queryWords) > 0 ? ($matchedWords / count($queryWords)) * 70.0 : 0.0;

        // Levenshtein / similar_text score
        similar_text($normQuery, $normText, $similarPercent);

        return max($wordScore, (float) $similarPercent);
    }

    /**
     * Apply fuzzy filtering and sorting to an Eloquent Builder or Collection.
     *
     * @param  array<string>  $columns
     */
    public function applyQueryFilter(Builder $queryBuilder, string $search, array $columns): Builder
    {
        $search = trim($search);
        if ($search === '') {
            return $queryBuilder;
        }

        return $queryBuilder->where(function ($query) use ($search, $columns) {
            foreach ($columns as $column) {
                $query->orWhere($column, 'LIKE', "%{$search}%");
            }
        });
    }

    /**
     * Sort a collection of models by fuzzy similarity score descending.
     *
     * @param  array<string>  $columns
     */
    public function sortBySimilarity(Collection $collection, string $search, array $columns): Collection
    {
        if (trim($search) === '') {
            return $collection;
        }

        return $collection->map(function ($item) use ($search, $columns) {
            $maxScore = 0.0;
            foreach ($columns as $col) {
                $val = $item->{$col} ?? '';
                $score = self::computeSimilarity($search, (string) $val);
                if ($score > $maxScore) {
                    $maxScore = $score;
                }
            }
            $item->_similarity_score = $maxScore;

            return $item;
        })->sortByDesc('_similarity_score')->values();
    }
}
