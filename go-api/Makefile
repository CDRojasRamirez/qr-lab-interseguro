.PHONY: run test lint keygen e2e

run:
	go run ./cmd/api

test:
	go test ./...

lint:
	go vet ./...

# Generates the RSA key pair (../keys/private.pem, ../keys/public.pem).
keygen:
	go run ./cmd/keygen -out ../keys

# Needs the stack running (docker compose up). Excluded from `make test`.
e2e:
	go test -tags=e2e ./test/e2e/... -v -count=1
