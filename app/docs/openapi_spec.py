OPENAPI_SPEC = {
    "openapi": "3.0.3",
    "info": {
        "title": "Polenguinho Decrypt Server API",
        "description": "Painel de descriptografia de retiradas registradas no LogCenter.",
        "version": "1.0.0",
    },
    "paths": {
        "/decrypt/data": {
            "get": {
                "tags": ["decrypt"],
                "summary": "Lista as retiradas registradas (agregação sobre a coleção 'logs')",
                "description": (
                    "Requer login prévio em /decrypt (sessão de cookie). O campo "
                    "'email' vem criptografado; a descriptografia acontece no navegador."
                ),
                "responses": {
                    "200": {
                        "description": "Lista de retiradas",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "array",
                                    "items": {"$ref": "#/components/schemas/Pickup"},
                                }
                            }
                        },
                    },
                    "401": {
                        "description": "Não autenticado",
                        "content": {
                            "application/json": {
                                "schema": {"$ref": "#/components/schemas/ErrorResponse"}
                            }
                        },
                    },
                },
            },
        },
    },
    "components": {
        "schemas": {
            "Pickup": {
                "type": "object",
                "properties": {
                    "horario": {"type": "string", "format": "date-time"},
                    "email": {"type": "string", "description": "Email criptografado"},
                    "userId": {"type": "string", "nullable": True},
                    "session": {"type": "string", "nullable": True},
                    "recall": {"type": "boolean"},
                },
            },
            "ErrorResponse": {
                "type": "object",
                "properties": {"error": {"type": "string"}},
            },
        }
    },
}
