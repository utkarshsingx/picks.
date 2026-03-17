"""
Django settings for picks backend.
"""

import os
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-key-change-in-production')

DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'drf_spectacular',
    'users',
    'wallets',
    'games',
    'sports',
    'channels',
    'kyc',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Django Channels (set USE_REDIS=true for production; InMemory for single-process dev)
REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
_use_redis = os.environ.get('USE_REDIS', 'false').lower() == 'true'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer' if _use_redis else 'channels.layers.InMemoryChannelLayer',
        **({'CONFIG': {'hosts': [REDIS_URL]}} if _use_redis else {}),
    },
}

_db_url = os.environ.get('DATABASE_URL')
DATABASES = {
    'default': dj_database_url.config(
        default=_db_url or 'sqlite:///db.sqlite3',
        conn_max_age=600,
    )
}

AUTH_USER_MODEL = 'users.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# KYC
KYC_MAX_FILE_SIZE_MB = float(os.environ.get('KYC_MAX_FILE_SIZE_MB', 5))

# CORS
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
}

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Email (dev: console backend)
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@picks.dev')
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# Wallets
WITHDRAWAL_AUTO_APPROVE_LIMIT_USD = float(os.environ.get('WITHDRAWAL_AUTO_APPROVE_LIMIT_USD', 500))
WITHDRAWAL_MIN_AMOUNT_USD = float(os.environ.get('WITHDRAWAL_MIN_AMOUNT_USD', 10))

# Games
GAMES_HOUSE_EDGE = float(os.environ.get('GAMES_HOUSE_EDGE', 0.01))
CRASH_ROUND_DURATION_SECONDS = int(os.environ.get('CRASH_ROUND_DURATION_SECONDS', 10))

# Sports (The Odds API)
ODDS_API_KEY = os.environ.get('ODDS_API_KEY')
ODDS_API_REGIONS = os.environ.get('ODDS_API_REGIONS', 'us').split(',')
ODDS_API_MARKETS = os.environ.get('ODDS_API_MARKETS', 'h2h,spreads,totals').split(',')
SPORTS_HOUSE_EDGE = float(os.environ.get('SPORTS_HOUSE_EDGE', 0.05))

# Payment gateways (optional)
NOWPAYMENTS_API_KEY = os.environ.get('NOWPAYMENTS_API_KEY')
NOWPAYMENTS_IPN_SECRET = os.environ.get('NOWPAYMENTS_IPN_SECRET')
NOWPAYMENTS_SANDBOX = os.environ.get('NOWPAYMENTS_SANDBOX', 'true').lower() == 'true'
STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

# drf-spectacular / Swagger API docs
SPECTACULAR_SETTINGS = {
    'TITLE': 'Picks API',
    'DESCRIPTION': '''
# Picks Betting Platform API

REST API for the Picks betting platform. Covers authentication, wallets, deposits, withdrawals, and transaction history.

## Authentication

Most endpoints require JWT authentication. Use `POST /api/auth/login/` with email and password to obtain an access token, then include it in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Use the **Authorize** button in Swagger UI to set your token for all requests.

## Base URL

- Development: `http://localhost:8000/api`
- Production: Set via your deployment environment
''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
    'TAGS': [
        {'name': 'auth', 'description': 'Authentication & identity management'},
        {'name': 'wallets', 'description': 'Wallet balances, deposits, withdrawals, transactions'},
        {'name': 'games', 'description': 'Casino games: Dice, Mines, Plinko, Crash'},
        {'name': 'sports', 'description': 'Live sports betting: events, odds, place bet'},
        {'name': 'kyc', 'description': 'KYC document upload and verification status'},
    ],
    'SECURITY': [{'BearerAuth': []}],
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'BearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
                'description': 'JWT access token from login',
            },
        },
    },
}
