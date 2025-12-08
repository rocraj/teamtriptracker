import { Pipe, PipeTransform } from '@angular/core';
import { TeamMember } from '../models';

@Pipe({
  name: 'userName',
  standalone: true
})
export class UserNamePipe implements PipeTransform {
  
  transform(userId: string | undefined | null, members: TeamMember[] | undefined | null): string {
    if (!userId || !members) {
      return userId || 'Unknown User';
    }
    
    const member = members.find(m => m.user_id === userId);
    return member ? member.user_name : `User ${userId.substring(0, 8)}...`;
  }
}