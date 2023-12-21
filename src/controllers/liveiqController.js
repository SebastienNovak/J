const LiveIQService = require('./services/liveiqService');

class LiveIQController {
    async getEmployees(req, res) {
        try {
            const data = await LiveIQService.getEmployees(req.body);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async putEmployees(req, res) {
        // Similar structure for putEmployees
    }

    async getReporting(req, res) {
        // Similar structure for getReporting
    }
}

module.exports = new LiveIQController();
