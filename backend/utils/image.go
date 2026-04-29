package utils

import (
	"errors"
	"io"	
	"mime/multipart"
	"fmt"
	"net/http"
	"sync"
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

var imageURLs = []string{
	"https://picsum.photos/id/10/400/300.jpg",
	"https://picsum.photos/id/20/400/300.jpg",
	"https://picsum.photos/id/30/400/300.jpg",
	"https://picsum.photos/id/40/400/300.jpg",
	"https://picsum.photos/id/50/400/300.jpg",
}

type Image struct {
	URL      string
	MimeType string
	Data     []byte
}

func downloadImage(url string) (Image, error) {
	resp, err := http.Get(url)
	if err != nil {
		return Image{}, fmt.Errorf("GET %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Image{}, fmt.Errorf("bad status %s for %s", resp.Status, url)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return Image{}, fmt.Errorf("reading body of %s: %w", url, err)
	}

	mimeType := resp.Header.Get("Content-Type")
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	return Image{URL: url, MimeType: mimeType, Data: data}, nil
}

func DownloadSeedImages() []Image {
	// Pre-allocate with known length so concurrent writes are safe
	// without a mutex — each goroutine owns its own index.
	images := make([]Image, len(imageURLs))

	var wg sync.WaitGroup
	for i, url := range imageURLs {
		wg.Add(1)
		go func(i int, url string) {
			defer wg.Done()
			img, err := downloadImage(url)
			if err != nil {
				fmt.Printf("skipping %s: %v", url, err)
				return
			}
			images[i] = img
			fmt.Printf("downloaded %s — %d bytes (%s)\n", url, len(img.Data), img.MimeType)
		}(i, url)
	}
	wg.Wait()

	return images
}
