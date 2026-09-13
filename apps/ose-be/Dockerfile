# Production multi-stage Dockerfile for ose-be (F# / Giraffe on .NET 10).
# Build context: repo root (e.g. `docker build -f apps/ose-be/Dockerfile .`).
#
# NOTE: the fsproj references generated OpenAPI contract types under
# apps/ose-be/generated-contracts/ (gitignored). Run `nx run ose-be:codegen`
# before building this image so the generated sources are present in the build context.

# Stage 1: restore + publish the release build with migrations embedded.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the project file first for restore-layer caching.
COPY apps/ose-be/src/OseBe/OseBe.fsproj apps/ose-be/src/OseBe/
COPY apps/ose-be/generated-contracts apps/ose-be/generated-contracts/
COPY apps/ose-be/db apps/ose-be/db/
# The shared env loader is a ProjectReference, so restore needs its project file
# and publish needs its sources.
COPY libs/fsharp-env-loader/fsharp-env-loader.fsproj libs/fsharp-env-loader/

RUN dotnet restore apps/ose-be/src/OseBe/OseBe.fsproj

# Copy the remaining sources and publish.
COPY apps/ose-be/src apps/ose-be/src/
COPY libs/fsharp-env-loader/src libs/fsharp-env-loader/src/

RUN dotnet publish apps/ose-be/src/OseBe/OseBe.fsproj \
  -c Release -o /app/publish --no-restore

# Stage 2: minimal ASP.NET runtime image.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Default port — override at runtime with `-e OSE_BE_PORT=<port>`, or with a `--port <port>`
# argument appended to the entrypoint. Until this change the variable was read by nothing.
ENV OSE_BE_PORT=8302
EXPOSE 8302

ENTRYPOINT ["dotnet", "OseBe.dll"]
