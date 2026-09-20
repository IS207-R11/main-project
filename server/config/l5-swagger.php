<?php

return [
    'default' => 'default',
    'documentations' => [
        'default' => [
            'api' => [
                'title' => 'FoodLife API Documentation',
            ],
            'routes' => [
                /*
                 * Route for accessing api documentation interface
                */
                'api' => 'api/documentation',
            ],
            'paths' => [
                /*
                 * File name of the generated json documentation file
                */
                'docs_json' => 'api-docs.json',

                /*
                 * File name of the generated yaml documentation file
                */
                'docs_yaml' => 'api-docs.yaml',

                /*
                * Set this to `json` or `yaml` to determine which documentation file to use in UI
                */
                'format_to_use_for_docs' => env('L5_FORMAT_TO_USE_FOR_DOCS', 'json'),

                /*
                 * Absolute paths to directory containing the swagger annotations are stored.
                */
                'annotations' => [
                    base_path('app'),
                ],
            ],
        ],
    ],
    'defaults' => [
        'routes' => [
            /*
             * Route for accessing parsed swagger annotations.
            */
            'docs' => 'docs',

            /*
             * Route for Oauth2 authentication callback.
            */
            'oauth2_callback' => 'api/oauth2-callback',

            /*
             * Middleware allows to prevent unauthorized access to API documentation
            */
            'middleware' => [
                'api' => [],
                'asset' => [],
                'docs' => [],
                'oauth2_callback' => [],
            ],

            /*
             * Route Group options
            */
            'group_options' => [],
        ],

        'paths' => [
            /*
             * Absolute path to location where parsed annotations will be stored
            */
            'docs' => storage_path('api-docs'),

            /*
             * Absolute path to directory where to export views
            */
            'views' => base_path('resources/views/vendor/l5-swagger'),

            /*
             * Edit to set the api format parameter on openapi.
             * OpenApi specification versions: '3.0.0'
            */
            'openapi_version' => env('OPENAPI_VERSION', '3.0.0'),

            /*
             * Base URL for the swagger UI assets
            */
            'base' => env('L5_SWAGGER_BASE_PATH', null),

            /*
             * Absolute path to directories that should be excluded from scanning
             * @deprecated Please use `scanOptions.exclude`
             * `scanOptions` value will inhibit this option
            */
            'excludes' => [],
        ],

        'scanOptions' => [
            'default_processors_configuration' => [],
            'analyser' => null,
            'analysis' => null,
            'processors' => [],
            'pattern' => null,
            'exclude' => [],
            'open_api_spec_version' => env('L5_SWAGGER_OPEN_API_SPEC_VERSION', '3.0.0'),
        ],

        'securityDefinitions' => [
            'securitySchemes' => [
                'bearerAuth' => [
                    'type' => 'http',
                    'description' => 'Enter Bearer Token in format: Bearer <token>',
                    'name' => 'Authorization',
                    'in' => 'header',
                    'scheme' => 'bearer',
                    'bearerFormat' => 'JWT',
                ],
            ],
            'security' => [
                [
                    'bearerAuth' => [],
                ],
            ],
        ],

        /*
         * Set this to `true` in development mode so that docs would be regenerated on each request
         * Default: false
        */
        'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', true),

        /*
         * Set this to `true` to generate a copy of documentation in yaml format
         * Default: false
        */
        'generate_yaml_copy' => env('L5_SWAGGER_GENERATE_YAML_COPY', false),

        /*
         * Set this to `true` to run generator in proxy mode
         * Default: false
        */
        'proxy' => false,

        /*
         * Configs plugin allows to fetch external configs instead of passing them to SwaggerUI.
         * Default: false
        */
        'additional_config_url' => null,

        /*
         * Turn to true if you want your operations to be sorted alphabetically
         * Default: null
        */
        'operations_sort' => env('L5_SWAGGER_OPERATIONS_SORT', null),

        /*
         * Turn to true if you want your models/schemas to be sorted alphabetically
         * Default: null
        */
        'models_sort' => env('L5_SWAGGER_MODELS_SORT', null),

        /*
         * Pass the validator url in order to enable swagger's validator.
         * Default: null
        */
        'validator_url' => null,

        /*
         * Swagger UI configuration parameters
        */
        'ui' => [
            'display' => [
                'dark_mode' => env('L5_SWAGGER_UI_DARK_MODE', false),
                'doc_expansion' => env('L5_SWAGGER_UI_DOC_EXPANSION', 'none'),
                'filter' => env('L5_SWAGGER_UI_FILTERS', true),
            ],

            'authorization' => [
                'persist_authorization' => env('L5_SWAGGER_UI_PERSIST_AUTHORIZATION', true),
                'oauth2' => [
                    'use_pkce_with_authorization_code_grant' => false,
                ],
            ],
        ],

        /*
         * Constants which can be used in annotations
        */
        'constants' => [
            'L5_SWAGGER_CONST_HOST' => env('L5_SWAGGER_CONST_HOST', 'http://localhost:8000'),
        ],
    ],
];
