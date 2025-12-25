import { reminderService } from '../reminders/reminder.service.js';
import { templateService } from '../templates/template.service.js';
// In future: import { contactService } from '../contacts/contact.service.js';
// In future: import { callService } from '../calls/call.service.js';

export class DashboardService {
  /**
   * Get main dashboard statistics
   */
  async getStats() {
    const reminderCounts = await reminderService.getCounts();
    const templateCounts = await templateService.getCounts();

    // Placeholder for when Contact and Call modules are ready
    const contactCount = 0; // await contactService.count();
    const callCount = 0; // await callService.count();

    return {
      reminders: reminderCounts,
      templates: templateCounts,
      contacts: {
        total: contactCount,
        leads: 0,
        customers: 0,
      },
      calls: {
        total: callCount,
        inbound: 0,
        outbound: 0,
        missed: 0,
      },
    };
  }

  /**
   * Get today's overview
   */
  async getTodayOverview() {
    const todaysReminders = await reminderService.getToday();
    const overdueReminders = await reminderService.getOverdue();

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
  async getInsights() {
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
