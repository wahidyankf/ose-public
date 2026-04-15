# ayokoding-web

Bilingual educational platform for software engineering content, focused on helping the Indonesian tech community learn and grow. Built with Hugo and the Hextra documentation theme.

## Overview

AyoKoding ("Let's Code" in Indonesian) is a platform dedicated to sharing software engineering knowledge in both Indonesian and English. It follows a "learning in public" philosophy, encouraging developers to share their learning journey with the community.

**Why AyoKoding Exists**

As we build [Open Sharia Enterprise](https://github.com/wahidyankf/ose-public)—an open-source platform for Sharia-compliant business systems—we're learning and researching extensively. Rather than keeping this knowledge internal, we share it with the wider tech community through AyoKoding.

The platform turns our real project work into educational content. When we research a technology stack, design a system architecture, or solve a complex problem for the enterprise platform, we document the learning journey and publish it here. This way, the research becomes useful beyond just our project—it helps developers everywhere learn and grow.

Think of it as "learning in public" at scale: our practical work on Open Sharia Enterprise becomes the foundation for tutorials, guides, and insights that benefit the global software engineering community.

## 🌐 Website

- **Production**: <https://ayokoding.com>
- **Repository**: Part of the [open-sharia-enterprise](https://github.com/wahidyankf/ose-public) monorepo

## Features

- **Bilingual Content**: Full support for Indonesian (ID) and English (EN)
- **Documentation-style Layout**: Clean, readable format using Hextra theme
- **YouTube Integration**: Connected with @AyoKoding YouTube channel
- **SEO Optimized**: Static site generation for fast loading and better SEO
- **Responsive Design**: Works across all devices
- **Dark/Light Theme**: User-preferred theme support

## Tech Stack

- **Static Site Generator**: Hugo (latest)
- **Theme**: Hextra documentation theme
- **Content Format**: Markdown with YAML frontmatter
- **Deployment**: Vercel
- **Languages**: Indonesian (primary), English

## Getting Started

### Prerequisites

- Hugo extended version (latest)

### Installation

```bash
# Install Hugo (macOS)
brew install hugo

# Navigate to project
cd apps/ayokoding-web
```

### Development

```bash
# Start development server
hugo server -D

# Server runs at http://localhost:3100
```

### Building

```bash
# Build for production
hugo --minify

# Output will be in public/ directory
```

## Content Structure

```
content/
├── _index.md              # Homepage
├── en/                    # English content
│   ├── _index.md
│   ├── about-ayokoding.md
│   └── learn/            # Learning materials
│       ├── _index.md
│       └── swe/          # Software engineering
└── id/                   # Indonesian content
    ├── _index.md
    ├── tentang-ayokoding.md
    └── belajar/          # Learning materials
```

## Creating New Content

### Using Archetypes

AyoKoding provides content templates (archetypes) for different content types. Use the appropriate archetype based on your content:

#### 1. Technical Learning Content

For tutorials, guides, and educational content:

```bash
# Indonesian
hugo new content/id/belajar/topic-name.md --kind learn

# English
hugo new content/en/learn/topic-name.md --kind learn
```

#### 2. Personal Essays/Rants (Celoteh)

For opinion pieces and personal narratives:

```bash
# Indonesian
hugo new content/id/celoteh/YYYY/essay-title.md --kind celoteh

# English
hugo new content/en/rants/YYYY/essay-title.md --kind celoteh
```

#### 3. Video Content

For YouTube video embeds:

```bash
# Indonesian
hugo new content/id/konten-video/series-name/video-title.md --kind konten-video

# English
hugo new content/en/video-content/series-name/video-title.md --kind konten-video
```

After creating, remember to:

1. Update the `youtube_id` field in frontmatter
2. Replace `YOUTUBE_ID_HERE` in the content with actual video ID

#### 4. Navigation/Index Pages

For section index pages:

```bash
# Indonesian
hugo new content/id/section-name/_index.md

# English
hugo new content/en/section-name/_index.md
```

#### 5. Default Content

For general pages:

```bash
# Indonesian
hugo new content/id/page-name.md

# English
hugo new content/en/page-name.md
```

### Content Frontmatter Fields

All content should include these frontmatter fields for optimal SEO:

| Field         | Required    | Description                     | Example                              |
| ------------- | ----------- | ------------------------------- | ------------------------------------ |
| `title`       | Yes         | Page title                      | `"How to Learn JavaScript"`          |
| `date`        | Yes         | Publication date (WIB/UTC+7)    | `2025-12-06T12:00:00+07:00`          |
| `lastmod`     | Recommended | Last modified date              | `2025-12-06T12:00:00+07:00`          |
| `draft`       | Yes         | Draft status                    | `false`                              |
| `description` | Recommended | SEO description (150-160 chars) | `"Learn JavaScript fundamentals..."` |
| `weight`      | Optional    | Ordering in menus               | `10`                                 |
| `tags`        | Recommended | Content tags                    | `["javascript", "tutorial"]`         |
| `categories`  | Recommended | Content categories              | `["learn"]`                          |
| `author`      | Recommended | Author name                     | `"Wahidyan Kresna Fridayoka"`        |
| `images`      | Recommended | Social sharing images           | `["/images/cover.png"]`              |
| `keywords`    | Optional    | SEO keywords                    | `["javascript tutorial"]`            |
| `youtube_id`  | Video only  | YouTube video ID                | `"dQw4w9WgXcQ"`                      |

### Content Writing Best Practices

1. **SEO Optimization**
   - Write descriptive titles (50-60 characters)
   - Craft compelling descriptions (150-160 characters)
   - Use relevant tags and categories
   - Include featured images when possible

2. **Content Structure**
   - Use clear heading hierarchy (H2, H3, H4)
   - Include introduction and summary sections
   - Add code examples with syntax highlighting
   - Use bullet points for scannability

3. **Bilingual Content**
   - Maintain consistency between ID and EN versions
   - Keep URLs synchronized (e.g., `/belajar/topic` ↔ `/learn/topic`)
   - Ensure equivalent content quality in both languages

4. **Images and Media**
   - Place images in `static/images/`
   - Use descriptive alt text
   - Optimize images for web (compress, resize)
   - For video content, use YouTube shortcode: `{{< youtube VIDEO_ID >}}`

5. **Internal Linking**
   - Link to related content within the site
   - Use descriptive anchor text
   - Ensure links work in both languages

## Configuration

Main configuration in `hugo.yaml`:

```yaml
baseURL: "https://ayokoding.com/"
title: "Ayo Koding"
theme: "hextra"

languages:
  en:
    languageName: "English"
    weight: 2
  id:
    languageName: "Indonesia"
    weight: 1

defaultContentLanguage: "id"
defaultContentLanguageInSubdir: false
```

## SEO Features

This site implements comprehensive SEO best practices:

### Meta Tags

- **Open Graph**: Facebook and social media sharing
- **Twitter Cards**: Twitter sharing with images
- **Canonical URLs**: Prevent duplicate content issues
- **Language Alternates**: Hreflang tags for bilingual content
- **JSON-LD Structured Data**: Rich search results

### Sitemaps & Feeds

- **XML Sitemap**: Auto-generated at `/sitemap.xml`
- **RSS Feeds**: Available for all content sections
- **Robots.txt**: Search engine crawling instructions

### Performance

- **Static Site**: Fast loading times
- **CDN Delivery**: Vercel edge network
- **Asset Optimization**: Minified CSS/JS
- **Image Optimization**: Recommended for all images

## Theme Customization

### Custom CSS

Add custom styles in `assets/css/custom.css`. This file is automatically loaded by Hextra.

```css
/* Example custom styles */
.your-custom-class {
  color: #your-color;
}
```

### Custom Layouts

Override theme layouts by creating files in `layouts/` directory:

- `layouts/partials/custom/head-end.html` - Custom head scripts/meta tags
- `layouts/partials/custom/footer.html` - Custom footer content
- `layouts/_default/single.html` - Single page layout override

### Custom Data

Store structured data in `data/` directory (YAML, JSON, or TOML):

- `data/social.yaml` - Social media profiles
- `data/authors.yaml` - Author information
- `data/testimonials.yaml` - User testimonials

### Internationalization (i18n)

Add custom translation strings in `i18n/` directory:

- `i18n/id.yaml` - Indonesian translations
- `i18n/en.yaml` - English translations

Example:

```yaml
# i18n/id.yaml
- id: readMore
  translation: "Baca Selengkapnya"
```

Use in templates:

```go-html-template
{{ i18n "readMore" }}
```

## Deployment

### Production Deployment to ayokoding.com

The project uses a dedicated production branch for automatic deployment to ayokoding.com via Vercel.

**Production Branch**: `prod-ayokoding-web`

### Automated Deployment (Primary)

Deployment is automated via the `test-and-deploy-ayokoding-web.yml` GitHub Actions workflow:

- **Schedule**: Runs at **6 AM and 6 PM WIB** (UTC+7) every day
- **Change detection**: Compares `HEAD` on `main` against `prod-ayokoding-web`, scoped to `apps/ayokoding-web/`. Skips build and deploy if nothing changed
- **Build**: Runs `nx build ayokoding-web` (Hugo extended build)
- **Deploy**: Force-pushes `main` to `prod-ayokoding-web`; Vercel detects the push and builds automatically

**Manual trigger**: The workflow can also be triggered on-demand from the GitHub Actions UI. Set `force_deploy=true` to deploy even if no changes are detected.

### Emergency / On-Demand Deployment

For immediate deployments outside the scheduled window, use the `apps-ayokoding-web-deployer` AI agent or run directly:

```bash
git push --force origin HEAD:prod-ayokoding-web
```

**Important Guidelines**:

- ✅ **DO**: Always work in `main` branch for all development
- ✅ **DO**: Let the automated workflow handle routine deployments
- ✅ **DO**: Keep `prod-ayokoding-web` synchronized with `main`
- ❌ **DON'T**: Commit directly to `prod-ayokoding-web` branch
- ❌ **DON'T**: Make changes in `prod-ayokoding-web` that don't exist in `main`
- ❌ **DON'T**: Use `prod-ayokoding-web` for development or experimentation

**Why This Approach?**

- **Automated deployments**: Content updates deploy automatically without manual intervention
- **Change-gated**: Builds only run when `apps/ayokoding-web/` content has actually changed, keeping CI costs low
- **Clean deployment trigger**: Vercel watches `prod-ayokoding-web` for production
- **Compliant with Trunk Based Development**: Environment branches serve deployment purposes only, not feature isolation
- **Simple rollback**: Revert `prod-ayokoding-web` to a previous commit if needed

### Vercel Configuration

Configuration in `vercel.json`:

```json
{
  "build": {
    "env": {
      "HUGO_VERSION": "0.xxx.x"
    }
  },
  "buildCommand": "hugo --minify",
  "outputDirectory": "public"
}
```

## Content Guidelines

### Writing Style

- Clear and concise explanations
- Practical examples
- Step-by-step tutorials
- Include code snippets

### Language Considerations

- Maintain consistency between ID/EN versions
- Use appropriate technical terms
- Consider cultural context

## Common Commands

```bash
hugo server -D   # Start development server
hugo --minify    # Build for production
./build.sh       # Custom build script
```

## Link Validation

Internal links in ayokoding-web use Hugo absolute paths (`/en/...`, `/id/...`) without the `.md`
extension. These links are validated automatically as part of the standard quality gate.

**Automated validation** runs as part of `test:quick`:

```bash
# Full quality gate (builds CLI, checks links, builds Hugo site)
nx run ayokoding-web:test:quick
```

**Standalone check**:

```bash
# Build CLI first (or use cached build), then check links
nx run ayokoding-web:links:check

# Or run the binary directly (requires CLI already built)
./apps/ayokoding-cli/dist/ayokoding-cli links check
```

**What gets validated:**

| Type                   | Example                  | Validated                                               |
| ---------------------- | ------------------------ | ------------------------------------------------------- |
| Internal Hugo absolute | `/en/learn/swe/overview` | Yes — by `ayokoding-cli links check`                    |
| External URL           | `https://example.com`    | Separately — by `apps-ayokoding-web-link-checker` agent |
| Same-page anchor       | `#section-name`          | Not validated                                           |

**If broken links are found:** The command exits with code 1 and prints a table listing the source
file, line number, link text, and broken target. Fix the target paths in the source files and
re-run to confirm.

**Note:** External links are tracked separately by the `apps-ayokoding-web-link-checker` AI agent,
which maintains a cache in `docs/metadata/external-links-status.yaml`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write content in Markdown
4. Test locally with Hugo server
5. Submit a pull request

## YouTube Integration

The platform is integrated with the @AyoKoding YouTube channel. Video content can be embedded using Hugo shortcodes.

## Related Documentation

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Hextra Theme Documentation](https://imfing.github.io/hextra/)
- [Monorepo Structure Reference](../../docs/reference/monorepo-structure.md)

## License

MIT License - see the [LICENSE](LICENSE) file for details.
