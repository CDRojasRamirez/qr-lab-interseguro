// Package api embeds the OpenAPI contract so the binary can serve it.
package api

import _ "embed"

// OpenAPISpec is the raw OpenAPI 3.1 document (contract-first source of truth).
//
//go:embed openapi.yaml
var OpenAPISpec []byte
