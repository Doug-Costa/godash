export interface NotificationProvider {
  sendMessage(to: string, text: string, config?: any): Promise<boolean>;
  sendTemplate(
    to: string,
    template: { subject?: string; content: string },
    variables: Record<string, any>,
    config?: any
  ): Promise<boolean>;
  validateConnection(config: any): Promise<{ success: boolean; message?: string }>;
  healthCheck(config: any): Promise<boolean>;
  parseWebhook(body: any): Promise<any>;
}
