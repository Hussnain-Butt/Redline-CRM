import { reminderService } from '../reminders/reminder.service.js';
import { templateService } from '../templates/template.service.js';
import { contactService } from '../contacts/contact.service.js';
import { callService } from '../calls/call.service.js';

export class DashboardService {
  /**
   * Get main dashboard statistics
   */
  async getStats(userId: string) {
    const [reminderCounts, templateCounts, contactTotal, callTotal] = await Promise.all([
      reminderService.getCounts(userId),
      templateService.getCounts(userId),
      contactService.count(userId),
      callService.count(userId)
    ]);

    return {
      reminders: reminderCounts,
      templates: templateCounts,
      contacts: {
        total: contactTotal,
        leads: 0, // In future: filter by status
        customers: 0,
      },
      calls: {
        total: callTotal,
        inbound: 0,
        outbound: 0,
        missed: 0,
      },
    };
  }

  /**
   * Get today's overview
   */
  async getTodayOverview(userId: string) {
    const todaysReminders = await reminderService.getToday(userId);
    const overdueReminders = await reminderService.getOverdue(userId);

    return {
      tasks: todaysReminders,
      overdue: overdueReminders,
      stats: {
        tasksCount: todaysReminders.length,
        overdueCount: overdueReminders.length,
      }
    };
  }

  /**
   * Get simplified AI insights (placeholder for now)
   */
  async getInsights(_userId: string) {
    // Note: userId passed if needed for personalized insights
    return [
      {
        type: 'suggestion',
        text: 'You have 3 leads that haven\'t been contacted in 7 days.',
        action: 'View Leads',
        link: '/contacts?filter=stale'
      },
      {
        type: 'alert',
        text: 'Call volume is down 15% compared to last week.',
        priority: 'medium'
      }
    ];
  }
}

export const dashboardService = new DashboardService();
