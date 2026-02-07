# LocaLens Demo Sample Files

This folder contains sample files for demonstrating LocaLens capabilities.

## Required Sample Files

### Images (for image analysis demo)

| Filename | Language | Expected Issues |
|----------|----------|-----------------|
| `ja_settings.png` | Japanese | Button text truncation |
| `de_menu.png` | German | Text overflow |
| `zh_dialog.png` | Chinese | Font rendering issue |
| `ko_inventory.png` | Korean | Alignment problem |
| `en_clean.png` | English | No issues (comparison) |

### Videos (for video analysis demo)

| Filename | Language | Duration | Expected Issues |
|----------|----------|----------|-----------------|
| `gameplay_de.mp4` | German | 2 min | 3-4 issues with timestamps |
| `gameplay_ja.mp4` | Japanese | 2 min | 2-3 issues with timestamps |

## Creating Sample Files

### Option 1: Use Game Screenshots

1. Take screenshots from a localized game
2. Ensure they contain visible localization issues
3. Name them according to the table above

### Option 2: Create Mock Screenshots

1. Use image editing software (Figma, Photoshop, etc.)
2. Create UI mockups with intentional issues:
   - Truncated text with "..."
   - Text overflowing buttons
   - Overlapping UI elements
   - Missing font glyphs (□□□)

### Option 3: Use Provided Test Images

Contact the team for pre-made sample files.

## File Requirements

### Images
- Format: PNG, JPG, or WebP
- Size: Under 10MB each
- Resolution: 1920x1080 recommended

### Videos
- Format: MP4, MOV, or WebM
- Size: Under 100MB
- Duration: Under 10 minutes
- Resolution: 1080p recommended

## Demo Scenario

1. **Image Demo** (1 min)
   - Upload `ja_settings.png`
   - Show detected truncation issue
   - Highlight bbox coordinates and suggestion

2. **Video Demo** (1.5 min)
   - Upload `gameplay_de.mp4`
   - Show multiple issues with timestamps
   - Demonstrate CSV export

3. **Comparison** (30 sec)
   - Show `en_clean.png` with no issues
   - Emphasize "no baseline needed"
