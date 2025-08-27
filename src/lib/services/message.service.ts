import connectMongoDB from '../mongodb';
import { Message, validateMessage, IMessage } from '../models/message.model';
import { ProjectMember } from '../models/projectMember.model';

export class MessageService {
  private static async init() {
    await connectMongoDB();
  }

  static async createMessage(data: any): Promise<IMessage> {
    await this.init();
    const validatedData = validateMessage(data);
    const message = new Message(validatedData);
    return await message.save();
  }

  static async getMessagesByProject(projectId: string, options: any = {}): Promise<IMessage[]> {
    await this.init();
    return await Message.findByProject(projectId, options);
  }

  static async searchMessages(projectId: string, searchTerm: string): Promise<IMessage[]> {
    await this.init();
    return await Message.searchMessages(projectId, searchTerm);
  }
}
