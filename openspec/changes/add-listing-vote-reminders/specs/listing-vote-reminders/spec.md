# Spec Delta

## Purpose

Appends operator-configured listing vote links to the daily-draw Telegram relay so the community is reminded to vote, without automating votes or risking the announcement itself.

## ADDED Requirements

### Requirement: Vote reminders are disabled by default
The system SHALL append vote links to the daily-draw Telegram caption only when `LISTING_VOTE_LINKS_ENABLED` is exactly the string `true` and at least one valid link is configured.

#### Scenario: Flag unset or not exactly true
- **WHEN** `LISTING_VOTE_LINKS_ENABLED` is unset, `false`, `1`, `yes`, or `TRUE`
- **THEN** the Telegram caption is identical to the caption produced before this change

#### Scenario: Flag true but no valid links
- **WHEN** the flag is `true` and `LISTING_VOTE_LINKS` is empty or contains only invalid entries
- **THEN** the caption is unchanged and the invalid entries are logged

### Requirement: Vote links are validated strictly
The system SHALL accept an entry only if its label is 1–32 characters from `[A-Za-z0-9 ._-]` and its URL uses `https:`, has a hostname, contains no userinfo, contains none of `<`, `>`, `"`, and is at most 200 characters; the system SHALL keep at most 8 links and SHALL drop duplicate URLs.

#### Scenario: Mixed valid and invalid entries
- **WHEN** the list contains an `http:` URL, a `javascript:` URL, a URL with `user:pass@`, a label with `<`, and two valid entries
- **THEN** only the two valid entries are rendered and the four invalid entries are reported with their positions

#### Scenario: More than eight valid entries
- **WHEN** nine or more valid entries are configured
- **THEN** only the first eight are rendered

### Requirement: Invalid configuration never blocks the announcement
Parsing and rendering vote links SHALL NOT throw; any failure SHALL result in the base caption being sent.

#### Scenario: Malformed list string
- **WHEN** `LISTING_VOTE_LINKS` is not parseable (for example missing separators)
- **THEN** the X post is published, the Telegram relay sends the base caption, and no exception propagates

### Requirement: Telegram caption limit is respected
The system SHALL NOT send a caption longer than 1,024 characters; when the base caption plus vote block would exceed the limit, the vote block SHALL be omitted and the base caption SHALL be sent unchanged.

#### Scenario: Block fits
- **WHEN** base caption plus vote block is at most 1,024 characters
- **THEN** both are sent

#### Scenario: Block does not fit
- **WHEN** base caption plus vote block exceeds 1,024 characters
- **THEN** only the base caption is sent and the base caption is not truncated

### Requirement: Rendered block is safe HTML
Labels and URLs SHALL be HTML-escaped before interpolation into the Telegram caption, and each link SHALL be rendered as `• <a href="URL">Label</a>` under a single `<b>Support EPWX</b>` header line.

#### Scenario: Label contains an ampersand after validation bypass
- **WHEN** a label or URL reaching the renderer contains `&`
- **THEN** it is emitted as `&amp;`

### Requirement: X post and votes are untouched
The system SHALL NOT change the X post text and SHALL NOT perform any request to a listing site.

#### Scenario: Feature enabled
- **WHEN** the feature is enabled and an announcement is published
- **THEN** the X request body is identical to the disabled case and no HTTP request is made to any configured vote URL
