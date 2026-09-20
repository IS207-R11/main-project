<?php

namespace App\Http\Controllers\Api;

use App\Enums\ReportStatus;
use App\Enums\ReportType;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Services\FuzzySearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Enum;
use OpenApi\Attributes as OA;

class ReportController extends Controller
{
    public function __construct(private FuzzySearchService $fuzzySearchService) {}

    #[OA\Get(
        path: '/reports',
        summary: 'Get list of reports (ADMIN or MODERATOR)',
        security: [['bearerAuth' => []]],
        tags: ['Reports'],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'pageSize', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'sort_by', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['resolved_at', 'created_at'])),
            new OA\Parameter(name: 'sort_order', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['asc', 'desc'], default: 'desc')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated list of reports'),
            new OA\Response(response: 401, description: 'Unauthorized'),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $page = (int) ($request->query('page') ?? 1);
        $pageSize = (int) ($request->query('pageSize') ?? $request->query('page-size') ?? $request->query('page_size') ?? 10);
        $search = (string) ($request->query('search') ?? '');
        $sortBy = $request->query('sort_by') ?? $request->query('sort-by');
        $sortOrder = strtolower($request->query('sort_order') ?? $request->query('sort-order') ?? 'desc');

        $query = Report::with(['author', 'resolvedByUser']);

        if ($sortBy && in_array($sortBy, ['resolved_at', 'created_at'])) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('report_id', 'desc');
        }

        if (trim($search) !== '') {
            $query = $this->fuzzySearchService->applyQueryFilter($query, $search, ['title', 'content']);
            $items = $query->get();
            $sortedItems = $this->fuzzySearchService->sortBySimilarity($items, $search, ['title', 'content']);
            $totalRecords = Report::count();
            $pagedItems = $sortedItems->slice(($page - 1) * $pageSize, $pageSize)->values();

            return response()->json([
                'data' => ReportResource::collection($pagedItems),
                'total_records' => $totalRecords,
            ]);
        }

        $totalRecords = Report::count();
        $reports = $query->offset(($page - 1) * $pageSize)->limit($pageSize)->get();

        return response()->json([
            'data' => ReportResource::collection($reports),
            'total_records' => $totalRecords,
        ]);
    }

    #[OA\Post(
        path: '/reports',
        summary: 'Submit a feedback or error report (USER)',
        security: [['bearerAuth' => []]],
        tags: ['Reports'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['content'],
                properties: [
                    new OA\Property(property: 'type', type: 'string', enum: ['COMMENT', 'ERROR'], default: 'ERROR'),
                    new OA\Property(property: 'title', type: 'string', example: 'App crashes on food detail'),
                    new OA\Property(property: 'content', type: 'string', example: 'Steps to reproduce the crash...'),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: 'Report created successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 422, description: 'Validation error'),
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'type' => ['nullable', new Enum(ReportType::class)],
            'title' => 'nullable|string|max:255',
            'content' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        $report = Report::create([
            'author_id' => $user->user_id,
            'type' => $request->input('type') ?? ReportType::ERROR,
            'status' => ReportStatus::PENDING,
            'title' => $request->input('title'),
            'content' => $request->input('content'),
        ]);

        $report->load(['author', 'resolvedByUser']);

        return response()->json([
            'message' => 'Report created successfully',
            'data' => new ReportResource($report),
        ], 201);
    }

    #[OA\Put(
        path: '/reports/{reportId}/change-status',
        summary: 'Change status of a report (ADMIN or MODERATOR)',
        security: [['bearerAuth' => []]],
        tags: ['Reports'],
        parameters: [
            new OA\Parameter(name: 'reportId', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['status'],
                properties: [
                    new OA\Property(property: 'status', type: 'string', enum: ['RESOLVED', 'PENDING']),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: 'Report status updated successfully'),
            new OA\Response(response: 401, description: 'Unauthorized'),
            new OA\Response(response: 404, description: 'Report not found'),
        ]
    )]
    public function changeStatus(Request $request, int|string $reportId): JsonResponse
    {
        $report = Report::find($reportId);
        if (! $report) {
            return response()->json(['message' => 'Report not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', new Enum(ReportStatus::class)],
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $newStatus = $request->input('status');
        $user = $request->user();

        $report->status = $newStatus;
        if ($newStatus === 'RESOLVED') {
            $report->resolved_by = $user->user_id;
            $report->resolved_at = now();
        } else {
            $report->resolved_by = null;
            $report->resolved_at = null;
        }

        $report->save();
        $report->load(['author', 'resolvedByUser']);

        return response()->json([
            'message' => 'Report status updated successfully',
            'data' => new ReportResource($report),
        ]);
    }
}
