import connectMongoDB from '../mongodb';
import { FileAccess, RoleChangeLog } from '../models/audit.model';
import { MemberJoinLog } from '../models/invitation.model';

export class AuditService {
  private static async init() {
    await connectMongoDB();
  }

  static async logFileAccess(data: any) {
    await this.init();
    const access = new FileAccess(data);
    return await access.save();
  }

  static async getMemberJoinHistory(projectId: string, options: any = {}) {
    await this.init();
    return await MemberJoinLog.findByProject(projectId, options.limit);
  }

  static async getRoleChangeHistory(projectId: string, options: any = {}) {
    await this.init();
    return await RoleChangeLog.findByProject(projectId, options);
  }

  static async getFileAccessLogs(fileId: string, options: any = {}) {
    await this.init();
    return await FileAccess.findByFile(fileId, options);
  }
}
