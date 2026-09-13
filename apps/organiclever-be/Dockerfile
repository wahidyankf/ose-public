# Production multi-stage Dockerfile for organiclever-be (F# / Giraffe on .NET 10).
# Build context: repo root (e.g. `docker build -f apps/organiclever-be/Dockerfile .`).
#
# NOTE: the fsproj references generated OpenAPI contract types under
# apps/organiclever-be/generated-contracts/ (gitignored). Run
# `nx run organiclever-be:codegen` before building this image so the generated
# sources are present in the build context.

# Stage 1: restore + publish the release build with migrations embedded.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy the project file first for restore-layer caching.
COPY apps/organiclever-be/src/OrganicleverBe/OrganicleverBe.fsproj apps/organiclever-be/src/OrganicleverBe/
COPY apps/organiclever-be/generated-contracts apps/organiclever-be/generated-contracts/
COPY apps/organiclever-be/db apps/organiclever-be/db/
# The shared env loader is a ProjectReference, so restore needs its project file
# and publish needs its sources.
COPY libs/fsharp-env-loader/fsharp-env-loader.fsproj libs/fsharp-env-loader/

RUN dotnet restore apps/organiclever-be/src/OrganicleverBe/OrganicleverBe.fsproj

# Copy the remaining sources and publish.
COPY apps/organiclever-be/src apps/organiclever-be/src/
COPY libs/fsharp-env-loader/src libs/fsharp-env-loader/src/

RUN dotnet publish apps/organiclever-be/src/OrganicleverBe/OrganicleverBe.fsproj \
  -c Release -o /app/publish --no-restore

# Stage 2: minimal ASP.NET runtime image.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Default port — override at runtime with `-e ORGANICLEVER_BE_PORT=<port>`, or with a `--port <port>`
# argument appended to the entrypoint. Until this change the variable was read by nothing.
ENV ORGANICLEVER_BE_PORT=8202
EXPOSE 8202

ENTRYPOINT ["dotnet", "OrganicleverBe.dll"]
