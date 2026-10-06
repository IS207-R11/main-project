<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use OpenApi\Attributes as OA;

class UploadController extends Controller
{
    #[OA\Post(
        path: '/upload/image',
        summary: 'Upload an image to Cloudinary (Authenticated user only)',
        description: 'Upload image with validation: user authenticated, file must be an image, size strictly under 5MB.',
        security: [['bearerAuth' => []]],
        tags: ['Upload'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\MediaType(
                mediaType: 'multipart/form-data',
                schema: new OA\Schema(
                    required: ['image'],
                    properties: [
                        new OA\Property(
                            property: 'image',
                            description: 'Image file (max 5MB, format: jpeg, png, jpg, webp, gif, svg, avif)',
                            type: 'string',
                            format: 'binary'
                        ),
                    ]
                )
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Image uploaded successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'message', type: 'string', example: 'Tải ảnh lên thành công'),
                        new OA\Property(
                            property: 'data',
                            type: 'object',
                            properties: [
                                new OA\Property(property: 'url', type: 'string', example: 'https://res.cloudinary.com/...'),
                                new OA\Property(property: 'secure_url', type: 'string', example: 'https://res.cloudinary.com/...'),
                                new OA\Property(property: 'public_id', type: 'string', example: 'foods/example_id'),
                            ]
                        ),
                    ]
                )
            ),
            new OA\Response(response: 401, description: 'Chưa xác thực người dùng'),
            new OA\Response(response: 422, description: 'File không hợp lệ hoặc kích thước vượt quá 5MB'),
        ]
    )]
    public function uploadImage(Request $request): JsonResponse
    {
        // 1. Xác thực người dùng
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'message' => 'Bạn cần đăng nhập để thực hiện tải ảnh lên.',
            ], 401);
        }

        // 2. Xác thực file & kích thước dưới 5MB (5120 KB = 5MB, size < 5MB)
        $validator = Validator::make($request->all(), [
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,jpg,webp,gif,svg,avif',
                'max:5120', // Giới hạn tối đa 5MB
            ],
        ], [
            'image.required' => 'Vui lòng chọn file hình ảnh cần tải lên.',
            'image.file' => 'Dữ liệu tải lên phải là một tập tin hợp lệ.',
            'image.image' => 'File tải lên bắt buộc phải là định dạng hình ảnh.',
            'image.mimes' => 'Hình ảnh chỉ chấp nhận các định dạng: jpeg, png, jpg, webp, gif, svg, avif.',
            'image.max' => 'Kích thước ảnh phải dưới 5MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first('image'),
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('image');

        // Kiểm tra kích thước chính xác theo bytes (< 5 * 1024 * 1024)
        $maxBytes = 5 * 1024 * 1024;
        if ($file->getSize() >= $maxBytes) {
            return response()->json([
                'message' => 'Kích thước ảnh phải dưới 5MB.',
                'errors' => [
                    'image' => ['Kích thước ảnh vượt quá giới hạn 5MB.'],
                ],
            ], 422);
        }

        try {
            $folder = 'foods';
            $uploadPreset = config('cloudinary.upload_preset');

            $options = [
                'folder' => $folder,
                'resource_type' => 'image',
            ];

            if (! empty($uploadPreset)) {
                $options['upload_preset'] = $uploadPreset;
            }

            // Tiến hành upload lên Cloudinary
            $uploadResult = cloudinary()->uploadApi()->upload(
                $file->getRealPath(),
                $options
            );

            $secureUrl = $uploadResult['secure_url'] ?? $uploadResult['url'] ?? '';
            $publicId = $uploadResult['public_id'] ?? '';

            return response()->json([
                'message' => 'Tải ảnh lên thành công',
                'data' => [
                    'url' => $secureUrl,
                    'secure_url' => $secureUrl,
                    'public_id' => $publicId,
                ],
            ], 200);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Lỗi khi tải ảnh lên Cloudinary: '.$e->getMessage(),
            ], 500);
        }
    }
}
