package main

import (
	"crypto/x509"
	"encoding/pem"
	"os"
	"path/filepath"
	"testing"
)

func TestGenerateWritesUsableKeyPair(t *testing.T) {
	dir := filepath.Join(t.TempDir(), "keys")
	if err := generate(dir); err != nil {
		t.Fatal(err)
	}
	privRaw, err := os.ReadFile(filepath.Join(dir, "private.pem"))
	if err != nil {
		t.Fatal(err)
	}
	blk, _ := pem.Decode(privRaw)
	if blk == nil || blk.Type != "PRIVATE KEY" {
		t.Fatal("private.pem is not PKCS#8 PEM")
	}
	if _, err := x509.ParsePKCS8PrivateKey(blk.Bytes); err != nil {
		t.Fatal(err)
	}
	pubRaw, err := os.ReadFile(filepath.Join(dir, "public.pem"))
	if err != nil {
		t.Fatal(err)
	}
	blk, _ = pem.Decode(pubRaw)
	if blk == nil || blk.Type != "PUBLIC KEY" {
		t.Fatal("public.pem is not PKIX PEM")
	}
	if _, err := x509.ParsePKIXPublicKey(blk.Bytes); err != nil {
		t.Fatal(err)
	}
}
