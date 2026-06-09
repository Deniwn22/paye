# Stage 1: Build the Go application
FROM golang:1.26-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git

# Set working directory
WORKDIR /app

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the entire source code
COPY . .

# Build the Go application statically
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o paye cmd/api/main.go

# Stage 2: Create a minimal production image
FROM alpine:3.19

# Install CA certificates for HTTPS requests and tzdata for timezone management
RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/paye .

# Expose port (default 8080)
EXPOSE 8080

# Run the web server
CMD ["./paye"]
