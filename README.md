# AstroBurst website

Static website for Dr Shabnam Iyyani's research group at IISER Thiruvananthapuram.
Plain HTML, CSS and a little JavaScript. No build step: edit a file, commit, and the site updates.

## Where things are

| To change | Edit |
|---|---|
| Home page (profile, employment, awards, grants) | `index.html` |
| Research text and figures | `research.html` |
| Team members and project students | `group.html` |
| Publication list | `publications.html` |
| Courses | `teaching.html` |
| Talks | `talks.html` |
| Openings | `opportunities.html` |
| Links and popular articles | `resources.html` |
| Photos | `gallery.html` and `assets/img/gallery/` |
| Colours, fonts, spacing | `assets/css/style.css` (the `:root` block at the top) |
| Menu and footer | Repeated at the top and bottom of every `.html` file |

### Add a publication
In `publications.html`, copy one `<article class="pub" ...>` block, paste it at the top of the right
year, and edit the title, authors, journal and `data-year`. Update the total in the `stats` block.

### Add a gallery photo
Put a large version (`photo-31.jpg`) and a small version (`thumb-31.jpg`, about 640 px wide) in
`assets/img/gallery/`, then copy one `<a href=...>` line in `gallery.html` and change the numbers.

### Add a team member
Put a square-ish photo in `assets/img/team/`, then copy one `<div class="member">` block in `group.html`.

## Publishing on GitHub Pages

1. Create a new public repository and upload everything in this folder (keep the folder structure).
2. In the repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save. The site appears at `https://USERNAME.github.io/REPOSITORY/`.

## Connecting the custom domain

1. In **Settings → Pages → Custom domain**, enter the domain (for example `www.example.org`) and save.
   GitHub adds a `CNAME` file to the repository.
2. At the domain registrar, add these DNS records:

   | Type | Name | Value |
   |---|---|---|
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | USERNAME.github.io |

3. Wait for DNS to update (minutes to a few hours), then tick **Enforce HTTPS** in Settings → Pages.
