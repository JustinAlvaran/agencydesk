Repository Documentation
```markdown
📂 Repository Structure
├── app/                 # Next.js App Router pages & layouts
├── components/          # Reusable React components
├── public/              # Static assets (images, fonts, etc.)
├── styles/              # Global stylesheets
├── .gitlab-ci.yml       # GitLab CI/CD pipeline definition
├── next.config.js       # Next.js configuration (static export setup)
├── package.json         # Project dependencies & scripts
├── README.md            # Root project overview
└── out/                 # Static export (generated after build)
```

🧩 Usage
Local Development
```bash
npm install
npm run dev
```

Runs local dev server on http://localhost:3000.

Edit app/page.tsx or other files → hot reloads automatically.

Static Export
```bash
npm run build && npm run export
```


Generates a static site in `/out` folder.

This `/out` folder is what gets deployed to S3 via GitLab CI/CD.

🛠️ CI/CD Notes

The `.gitlab-ci.yml` handles build & deploy.

Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are configured in GitLab CI/CD variables.  

Pipeline steps:

Build: Generates `/out`.

Deploy: Syncs `/out` to S3 & invalidates CloudFront.

👨‍💻 Developer Guidelines

Follow consistent branch naming `(feature/*, bugfix/*)`.

Use descriptive commits.

Keep components reusable and maintainable.

Ensure build passes locally before pushing.