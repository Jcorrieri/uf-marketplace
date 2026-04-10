package utils

import (
	"errors"
	"io"
	"mime/multipart"
	"net/http"
)

const MaxImageSize = 5 * 1024 * 1024

func ProcessImageFile(fileHeader *multipart.FileHeader) ([]byte, string, error) {
	if fileHeader.Size > int64(MaxImageSize) {
		return nil, "", errors.New("image must be under 5MB")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return nil, "", errors.New("failed to open image")
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return nil, "", errors.New("failed to read image")
	}

	mimeType := http.DetectContentType(data)
	if mimeType != "image/jpeg" && mimeType != "image/png" {
		return nil, "", errors.New("only JPEG and PNG images are allowed")
	}

	return data, mimeType, nil
}
