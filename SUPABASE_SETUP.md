# AIDI website admin setup

The website is static HTML. This setup connects it to Supabase for administrator sign-in, published page text and photos, community stories, contact messages, and donation information requests.

## 1. Create the Supabase project

Create a Supabase project and keep its database password private. In **Project Settings → API**, copy:

- The Project URL
- The publishable key (or legacy `anon` key)

These two values are designed for browser use. Never put a `service_role` or secret key in website files.

## 2. Configure the website

Open `assets/supabase-config.js` and set the project URL and publishable/anon key:

```js
window.AIDI_SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-public-publishable-or-anon-key'
};
```

The same configuration is used by the public site and `admin.html`. Serve the website over HTTPS (or through a local HTTP development server); browser security prevents the admin editor from reading the static pages when opened directly with `file://`.

## 3. Create the database and storage policies

In the Supabase project, open **SQL Editor**, paste the contents of `supabase/schema.sql`, and run it. The script creates the tables, row-level security policies, administrator checks, and public-read image bucket. Contact messages and donation requests can be inserted by site visitors, but can only be read, updated, or deleted by an approved administrator.

## 4. Create the first administrator

In **Authentication → Users**, add an administrator account with a verified email and a strong password. Copy that user's UUID, then run this statement in SQL Editor, replacing the example UUID:

```sql
insert into public.aidi_admins (user_id)
values ('00000000-0000-0000-0000-000000000000');
```

Do not enable public sign-up for this admin dashboard. Add or remove administrators by changing rows in `public.aidi_admins` through the Supabase dashboard/SQL Editor.

In **Authentication → URL Configuration**, set the deployed site as the Site URL and add `https://your-site-domain/admin.html` to the Redirect URLs so password-reset links can return to the admin page.

## 5. Sign in and manage the site

Visit `/admin.html` on the deployed site and sign in with the administrator email and password. The dashboard provides:

- **Pages & photos:** edit existing page text, replace site photos and logos, and change image descriptions. Saved text and images are published immediately.
- **Stories:** create drafts, publish, edit, or delete community stories. Published stories appear in the Stories page.
- **Messages:** read contact form submissions, change status, or delete them.
- **Donation requests:** read donation-information enquiries, change status, or delete them.

The page editor changes existing text and image content, not the visual layout or section order. Those structural design changes still require a code update.

## Data and privacy notes

- The browser only receives the public Supabase key; all permissions are enforced by database and storage policies.
- Do not store payment-card details or sensitive financial credentials in donation request messages.
- The inboxes are not email notification services. Administrators must sign in to review new submissions.
- Supabase project backups/retention and administrator password recovery should be configured in the Supabase dashboard.
