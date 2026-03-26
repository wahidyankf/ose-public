FROM golang:1.25-alpine AS build
RUN apk add --no-cache build-base git
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./cmd/server/

FROM alpine:3.22
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=build /build/server ./server
EXPOSE 8201
ENV PORT=8201
CMD ["./server"]
