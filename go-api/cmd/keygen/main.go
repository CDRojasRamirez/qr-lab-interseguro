// Command keygen generates the RSA 2048 key pair used to sign (Go) and verify
// (Node) the JWTs.
//
// Usage:
//
//	go run ./cmd/keygen [-out ../keys]
//
// It writes private.pem (PKCS#8, mode 0600) and public.pem (PKIX) into -out.
package main

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"flag"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	out := flag.String("out", "../keys", "output directory")
	flag.Parse()
	if err := generate(*out); err != nil {
		fmt.Fprintln(os.Stderr, "keygen:", err)
		os.Exit(1)
	}
	fmt.Println("keys written to", *out)
}

func generate(dir string) error {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return fmt.Errorf("generate key: %w", err)
	}
	priv, err := x509.MarshalPKCS8PrivateKey(key)
	if err != nil {
		return fmt.Errorf("marshal private key: %w", err)
	}
	pub, err := x509.MarshalPKIXPublicKey(&key.PublicKey)
	if err != nil {
		return fmt.Errorf("marshal public key: %w", err)
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	if err := writePEM(filepath.Join(dir, "private.pem"), "PRIVATE KEY", priv, 0o600); err != nil {
		return err
	}
	return writePEM(filepath.Join(dir, "public.pem"), "PUBLIC KEY", pub, 0o644)
}

func writePEM(path, typ string, der []byte, perm os.FileMode) error {
	data := pem.EncodeToMemory(&pem.Block{Type: typ, Bytes: der})
	return os.WriteFile(path, data, perm)
}
