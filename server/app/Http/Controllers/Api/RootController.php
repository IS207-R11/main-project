<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Response;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'FoodLife API Documentation',
    description: 'RESTful API specifications for FoodLife Backend'
)]
#[OA\Server(
    url: '/api',
    description: 'API Server'
)]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter your Bearer Access Token'
)]
class RootController extends Controller
{
    #[OA\Get(
        path: '/',
        summary: 'Server status health check',
        description: 'Check if the backend server is running',
        tags: ['System'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Server is running',
                content: new OA\MediaType(
                    mediaType: 'text/plain',
                    schema: new OA\Schema(type: 'string', example: 'Server is running')
                )
            ),
        ]
    )]
    public function index(): Response
    {
        return response('Server is running', 200)
            ->header('Content-Type', 'text/plain');
    }
}
