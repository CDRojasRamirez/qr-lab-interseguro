.PHONY: keys up down logs e2e test

keys:
	cd go-api && go run ./cmd/keygen -out ../keys

up:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

e2e:
	cd go-api && go test -tags=e2e ./test/e2e/... -v -count=1

test:
	cd go-api && go test ./...
	cd node-api && npm test
