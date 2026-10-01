import * as reportService from '../services/reportService.js';

export async function createReport(req, res) {
  try {
    const report = await reportService.createReport({
      reporterId: req.user?.sub,
      reportedUserId: req.body?.reportedUserId || null,
      reportType: req.body?.reportType,
      message: req.body?.message,
    });
    return res.status(201).json({ report });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to create report.' });
  }
}

export async function listReports(req, res) {
  try {
    const reports = await reportService.listReports({
      reporterId: req.query.reporterId,
      status: req.query.status,
    });
    return res.status(200).json({ reports });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to load reports.' });
  }
}

export async function updateReportStatus(req, res) {
  try {
    const report = await reportService.updateReportStatus(req.params.id, req.body?.status);
    return res.status(200).json({ report });
  } catch (error) {
    return res.status(400).json({ error: error.message || 'Unable to update report status.' });
  }
}
