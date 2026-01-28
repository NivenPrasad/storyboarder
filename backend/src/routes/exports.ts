import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import db from '../db/database';
import { optionalAuth, AuthRequest } from '../middleware/auth';

const router = Router();

interface DbStoryboard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_duration: number | null;
  template_type: string | null;
  is_public: number;
  share_link: string | null;
  created_at: string;
  updated_at: string;
}

interface DbScene {
  id: string;
  storyboard_id: string;
  scene_order: number;
  title: string;
  description: string;
  shot_type: string;
  camera_angle: string;
  duration: number;
  scene_type: string;
  location: string;
  props: string;
  talent: string;
  lighting_notes: string | null;
  audio_notes: string | null;
  camera_movement: string | null;
  equipment: string;
  time_of_day: string | null;
  dialogue: string | null;
  on_screen_text: string | null;
  director_notes: string | null;
  checklist: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

function checkAccess(storyboardId: string, userId: string | undefined): { allowed: boolean; storyboard?: DbStoryboard } {
  const storyboard = db.prepare('SELECT * FROM storyboards WHERE id = ?').get(storyboardId) as DbStoryboard | undefined;

  if (!storyboard) {
    return { allowed: false };
  }

  if (storyboard.user_id === userId) {
    return { allowed: true, storyboard };
  }

  if (storyboard.is_public) {
    return { allowed: true, storyboard };
  }

  if (userId) {
    const collab = db.prepare(`
      SELECT * FROM storyboard_collaborators
      WHERE storyboard_id = ? AND user_id = ?
    `).get(storyboardId, userId);

    if (collab) {
      return { allowed: true, storyboard };
    }
  }

  return { allowed: false };
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// Export as CSV
router.get('/:id/csv', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const scenes = db.prepare(`
      SELECT * FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboard.id) as DbScene[];

    // CSV header
    const headers = [
      'Scene #', 'Title', 'Description', 'Shot Type', 'Camera Angle',
      'Duration (s)', 'Scene Type', 'Location', 'Props', 'Talent',
      'Lighting Notes', 'Audio Notes', 'Camera Movement', 'Equipment',
      'Time of Day', 'Dialogue', 'On-Screen Text', 'Director Notes',
      'Priority', 'Status', 'Assigned To', 'Tags'
    ];

    const csvRows = [headers.join(',')];

    for (const scene of scenes) {
      const row = [
        scene.scene_order,
        `"${(scene.title || '').replace(/"/g, '""')}"`,
        `"${(scene.description || '').replace(/"/g, '""')}"`,
        scene.shot_type,
        scene.camera_angle,
        scene.duration,
        scene.scene_type,
        `"${(scene.location || '').replace(/"/g, '""')}"`,
        `"${JSON.parse(scene.props || '[]').join(', ')}"`,
        `"${JSON.parse(scene.talent || '[]').join(', ')}"`,
        `"${(scene.lighting_notes || '').replace(/"/g, '""')}"`,
        `"${(scene.audio_notes || '').replace(/"/g, '""')}"`,
        scene.camera_movement || '',
        `"${JSON.parse(scene.equipment || '[]').join(', ')}"`,
        scene.time_of_day || '',
        `"${(scene.dialogue || '').replace(/"/g, '""')}"`,
        `"${(scene.on_screen_text || '').replace(/"/g, '""')}"`,
        `"${(scene.director_notes || '').replace(/"/g, '""')}"`,
        scene.priority,
        scene.status,
        scene.assigned_to || '',
        `"${JSON.parse(scene.tags || '[]').join(', ')}"`
      ];
      csvRows.push(row.join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${storyboard.title.replace(/[^a-z0-9]/gi, '_')}_shot_list.csv"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export CSV', code: 'SERVER_ERROR' });
  }
});

// Export as JSON
router.get('/:id/json', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const scenes = db.prepare(`
      SELECT * FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboard.id) as DbScene[];

    const exportData = {
      title: storyboard.title,
      description: storyboard.description,
      targetDuration: storyboard.target_duration,
      exportedAt: new Date().toISOString(),
      totalDuration: scenes.reduce((sum, s) => sum + s.duration, 0),
      sceneCount: scenes.length,
      scenes: scenes.map(scene => ({
        order: scene.scene_order,
        title: scene.title,
        description: scene.description,
        shotType: scene.shot_type,
        cameraAngle: scene.camera_angle,
        duration: scene.duration,
        sceneType: scene.scene_type,
        location: scene.location,
        props: JSON.parse(scene.props || '[]'),
        talent: JSON.parse(scene.talent || '[]'),
        lightingNotes: scene.lighting_notes,
        audioNotes: scene.audio_notes,
        cameraMovement: scene.camera_movement,
        equipment: JSON.parse(scene.equipment || '[]'),
        timeOfDay: scene.time_of_day,
        dialogue: scene.dialogue,
        onScreenText: scene.on_screen_text,
        directorNotes: scene.director_notes,
        checklist: JSON.parse(scene.checklist || '[]'),
        priority: scene.priority,
        status: scene.status,
        assignedTo: scene.assigned_to,
        tags: JSON.parse(scene.tags || '[]')
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${storyboard.title.replace(/[^a-z0-9]/gi, '_')}_storyboard.json"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Export JSON error:', error);
    res.status(500).json({ message: 'Failed to export JSON', code: 'SERVER_ERROR' });
  }
});

// Export as PDF
router.get('/:id/pdf', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const scenes = db.prepare(`
      SELECT * FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboard.id) as DbScene[];

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${storyboard.title.replace(/[^a-z0-9]/gi, '_')}_storyboard.pdf"`);

    doc.pipe(res);

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text(storyboard.title, { align: 'center' });
    doc.moveDown(0.5);

    // Description
    if (storyboard.description) {
      doc.fontSize(12).font('Helvetica').text(storyboard.description, { align: 'center' });
      doc.moveDown(0.5);
    }

    // Stats
    doc.fontSize(10).font('Helvetica')
      .text(`Total Duration: ${formatDuration(totalDuration)} | Scenes: ${scenes.length}`, { align: 'center' });
    if (storyboard.target_duration) {
      doc.text(`Target Duration: ${formatDuration(storyboard.target_duration)}`, { align: 'center' });
    }
    doc.moveDown(1);

    // Scenes
    for (const scene of scenes) {
      // Check if we need a new page
      if (doc.y > 650) {
        doc.addPage();
      }

      // Scene header
      doc.fontSize(14).font('Helvetica-Bold')
        .text(`Scene ${scene.scene_order}: ${scene.title}`);
      doc.moveDown(0.3);

      // Scene details
      doc.fontSize(10).font('Helvetica');

      // Row 1: Shot details
      doc.text(`Shot Type: ${scene.shot_type} | Camera: ${scene.camera_angle} | Duration: ${formatDuration(scene.duration)}`);

      // Row 2: Scene type and location
      doc.text(`Type: ${scene.scene_type} | Location: ${scene.location || 'Not specified'}`);

      // Description
      if (scene.description) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Oblique').text('Description:', { continued: true }).font('Helvetica').text(` ${scene.description}`);
      }

      // Props and Talent
      const props = JSON.parse(scene.props || '[]');
      const talent = JSON.parse(scene.talent || '[]');
      if (props.length > 0 || talent.length > 0) {
        doc.moveDown(0.3);
        if (props.length > 0) {
          doc.text(`Props: ${props.join(', ')}`);
        }
        if (talent.length > 0) {
          doc.text(`Talent: ${talent.join(', ')}`);
        }
      }

      // Dialogue
      if (scene.dialogue) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Dialogue:', { continued: false });
        doc.font('Helvetica').text(scene.dialogue);
      }

      // Director Notes
      if (scene.director_notes) {
        doc.moveDown(0.3);
        doc.font('Helvetica-Bold').text('Director Notes:', { continued: false });
        doc.font('Helvetica').text(scene.director_notes);
      }

      // Status
      doc.moveDown(0.3);
      doc.fontSize(9).text(`Status: ${scene.status} | Priority: ${scene.priority}`);

      doc.moveDown(1);

      // Add a subtle line between scenes
      if (scene.scene_order < scenes.length) {
        doc.moveTo(50, doc.y - 10).lineTo(550, doc.y - 10).stroke('#cccccc');
        doc.moveDown(0.5);
      }
    }

    // Footer
    doc.fontSize(8).font('Helvetica')
      .text(`Generated on ${new Date().toLocaleString()}`, 50, doc.page.height - 50, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Failed to export PDF', code: 'SERVER_ERROR' });
  }
});

// Export for Notion (Markdown format)
router.get('/:id/notion', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const scenes = db.prepare(`
      SELECT * FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboard.id) as DbScene[];

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    let markdown = `# ${storyboard.title}\n\n`;

    if (storyboard.description) {
      markdown += `${storyboard.description}\n\n`;
    }

    markdown += `**Total Duration:** ${formatDuration(totalDuration)} | **Scenes:** ${scenes.length}\n`;
    if (storyboard.target_duration) {
      markdown += `**Target Duration:** ${formatDuration(storyboard.target_duration)}\n`;
    }
    markdown += '\n---\n\n';

    for (const scene of scenes) {
      markdown += `## Scene ${scene.scene_order}: ${scene.title}\n\n`;
      markdown += `| Property | Value |\n`;
      markdown += `|----------|-------|\n`;
      markdown += `| Shot Type | ${scene.shot_type} |\n`;
      markdown += `| Camera Angle | ${scene.camera_angle} |\n`;
      markdown += `| Duration | ${formatDuration(scene.duration)} |\n`;
      markdown += `| Scene Type | ${scene.scene_type} |\n`;
      markdown += `| Location | ${scene.location || '-'} |\n`;
      markdown += `| Status | ${scene.status} |\n`;
      markdown += `| Priority | ${scene.priority} |\n`;
      markdown += '\n';

      if (scene.description) {
        markdown += `**Description:** ${scene.description}\n\n`;
      }

      const props = JSON.parse(scene.props || '[]');
      const talent = JSON.parse(scene.talent || '[]');
      if (props.length > 0) {
        markdown += `**Props:** ${props.join(', ')}\n\n`;
      }
      if (talent.length > 0) {
        markdown += `**Talent:** ${talent.join(', ')}\n\n`;
      }

      if (scene.dialogue) {
        markdown += `**Dialogue:**\n> ${scene.dialogue.replace(/\n/g, '\n> ')}\n\n`;
      }

      if (scene.director_notes) {
        markdown += `**Director Notes:**\n${scene.director_notes}\n\n`;
      }

      markdown += '---\n\n';
    }

    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${storyboard.title.replace(/[^a-z0-9]/gi, '_')}_notion.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Export Notion error:', error);
    res.status(500).json({ message: 'Failed to export for Notion', code: 'SERVER_ERROR' });
  }
});

// Export for Google Docs (HTML format that Google Docs can import)
router.get('/:id/gdocs', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const scenes = db.prepare(`
      SELECT * FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboard.id) as DbScene[];

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${storyboard.title}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .meta { color: #666; margin-bottom: 20px; }
    .scene { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
    .scene-header { background: #f5f5f5; margin: -15px -15px 15px; padding: 10px 15px; border-radius: 5px 5px 0 0; }
    .scene-title { font-size: 18px; font-weight: bold; color: #333; }
    .details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 15px; }
    .detail { font-size: 14px; }
    .label { font-weight: bold; color: #555; }
    .dialogue { background: #f9f9f9; padding: 10px; border-left: 3px solid #007bff; margin: 10px 0; }
    .notes { background: #fff3cd; padding: 10px; border-radius: 5px; margin: 10px 0; }
  </style>
</head>
<body>
  <h1>${storyboard.title}</h1>
  ${storyboard.description ? `<p>${storyboard.description}</p>` : ''}
  <p class="meta">
    <strong>Total Duration:</strong> ${formatDuration(totalDuration)} |
    <strong>Scenes:</strong> ${scenes.length}
    ${storyboard.target_duration ? ` | <strong>Target:</strong> ${formatDuration(storyboard.target_duration)}` : ''}
  </p>
`;

    for (const scene of scenes) {
      const props = JSON.parse(scene.props || '[]');
      const talent = JSON.parse(scene.talent || '[]');

      html += `
  <div class="scene">
    <div class="scene-header">
      <span class="scene-title">Scene ${scene.scene_order}: ${scene.title}</span>
    </div>
    <div class="details">
      <div class="detail"><span class="label">Shot Type:</span> ${scene.shot_type}</div>
      <div class="detail"><span class="label">Camera:</span> ${scene.camera_angle}</div>
      <div class="detail"><span class="label">Duration:</span> ${formatDuration(scene.duration)}</div>
      <div class="detail"><span class="label">Type:</span> ${scene.scene_type}</div>
      <div class="detail"><span class="label">Location:</span> ${scene.location || '-'}</div>
      <div class="detail"><span class="label">Status:</span> ${scene.status}</div>
    </div>
    ${scene.description ? `<p><strong>Description:</strong> ${scene.description}</p>` : ''}
    ${props.length > 0 ? `<p><strong>Props:</strong> ${props.join(', ')}</p>` : ''}
    ${talent.length > 0 ? `<p><strong>Talent:</strong> ${talent.join(', ')}</p>` : ''}
    ${scene.dialogue ? `<div class="dialogue"><strong>Dialogue:</strong><br>${scene.dialogue.replace(/\n/g, '<br>')}</div>` : ''}
    ${scene.director_notes ? `<div class="notes"><strong>Director Notes:</strong><br>${scene.director_notes.replace(/\n/g, '<br>')}</div>` : ''}
  </div>
`;
    }

    html += `
  <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
    Generated on ${new Date().toLocaleString()}
  </p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${storyboard.title.replace(/[^a-z0-9]/gi, '_')}_gdocs.html"`);
    res.send(html);
  } catch (error) {
    console.error('Export Google Docs error:', error);
    res.status(500).json({ message: 'Failed to export for Google Docs', code: 'SERVER_ERROR' });
  }
});

// Print-friendly HTML view
router.get('/:id/print', optionalAuth, (req: AuthRequest, res: Response) => {
  try {
    const { allowed, storyboard } = checkAccess(req.params.id, req.userId);

    if (!allowed || !storyboard) {
      return res.status(404).json({ message: 'Storyboard not found', code: 'NOT_FOUND' });
    }

    const scenes = db.prepare(`
      SELECT * FROM scenes WHERE storyboard_id = ? ORDER BY scene_order ASC
    `).all(storyboard.id) as DbScene[];

    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${storyboard.title} - Print View</title>
  <style>
    @media print {
      .scene { page-break-inside: avoid; }
    }
    body { font-family: 'Courier New', monospace; line-height: 1.4; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { text-align: center; border-bottom: 2px double #000; padding-bottom: 10px; }
    .meta { text-align: center; margin-bottom: 30px; }
    .scene { border: 1px solid #000; padding: 10px; margin-bottom: 15px; }
    .scene-num { font-weight: bold; font-size: 12px; }
    .scene-title { font-weight: bold; font-size: 14px; text-transform: uppercase; }
    .scene-row { display: flex; justify-content: space-between; font-size: 11px; border-bottom: 1px dotted #999; padding: 2px 0; }
    .dialogue { margin: 10px 40px; font-style: italic; }
    .notes { margin: 10px 0; padding: 5px; background: #f0f0f0; font-size: 11px; }
    .checkbox { display: inline-block; width: 12px; height: 12px; border: 1px solid #000; margin-right: 5px; }
  </style>
</head>
<body>
  <h1>${storyboard.title}</h1>
  <div class="meta">
    ${storyboard.description ? `<p>${storyboard.description}</p>` : ''}
    <p>Total: ${formatDuration(totalDuration)} | ${scenes.length} Scenes${storyboard.target_duration ? ` | Target: ${formatDuration(storyboard.target_duration)}` : ''}</p>
  </div>
`;

    for (const scene of scenes) {
      const props = JSON.parse(scene.props || '[]');
      const talent = JSON.parse(scene.talent || '[]');
      const checklist = JSON.parse(scene.checklist || '[]');

      html += `
  <div class="scene">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <span class="scene-num">SCENE ${scene.scene_order}</span>
      <span class="scene-title">${scene.title}</span>
      <span style="font-size: 11px;">${formatDuration(scene.duration)}</span>
    </div>
    <div class="scene-row"><span>Shot: ${scene.shot_type}</span><span>Camera: ${scene.camera_angle}</span></div>
    <div class="scene-row"><span>Type: ${scene.scene_type}</span><span>Location: ${scene.location || 'TBD'}</span></div>
    ${scene.description ? `<p style="font-size: 12px; margin: 10px 0;">${scene.description}</p>` : ''}
    ${props.length > 0 ? `<div style="font-size: 11px;">PROPS: ${props.join(', ')}</div>` : ''}
    ${talent.length > 0 ? `<div style="font-size: 11px;">TALENT: ${talent.join(', ')}</div>` : ''}
    ${scene.dialogue ? `<div class="dialogue">"${scene.dialogue}"</div>` : ''}
    ${scene.director_notes ? `<div class="notes">NOTES: ${scene.director_notes}</div>` : ''}
    ${checklist.length > 0 ? `<div style="margin-top: 10px; font-size: 11px;">${checklist.map((item: any) => `<div><span class="checkbox"></span>${item.text}</div>`).join('')}</div>` : ''}
    <div style="text-align: right; font-size: 10px; margin-top: 5px;">Status: ${scene.status} | Priority: ${scene.priority}</div>
  </div>
`;
    }

    html += `
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Export print error:', error);
    res.status(500).json({ message: 'Failed to generate print view', code: 'SERVER_ERROR' });
  }
});

export default router;
