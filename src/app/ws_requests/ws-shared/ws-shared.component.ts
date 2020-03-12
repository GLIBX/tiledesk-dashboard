import { Component, OnInit } from '@angular/core';
import { UsersLocalDbService } from '../../services/users-local-db.service';
import { BotLocalDbService } from '../../services/bot-local-db.service';
import { avatarPlaceholder, getColorBck } from '../../utils/util';
import { Router } from '@angular/router';
import { WsRequestsService } from '../../services/websocket/ws-requests.service';
import { FaqKbService } from '../../services/faq-kb.service';
import { UsersService } from '../../services/users.service';


@Component({
  selector: 'appdashboard-ws-shared',
  templateUrl: './ws-shared.component.html',
  styleUrls: ['./ws-shared.component.scss']
})
export class WsSharedComponent implements OnInit {

  members_array: any;
  agents_array: any;
  cleaned_members_array: any;
  requester_fullname_initial: string;
  fillColour: string;
  user_name: string;
  user_email: string;
  department_name: string;
  department_id: string;
  source_page: string;
  participantsInRequests: any;
  depts_array_noduplicate = [];
  OPEN_RIGHT_SIDEBAR = false;
  selectedQuestion: string;
  train_bot_sidebar_height: any;
  newParticipants: any
  user: any;
  constructor(
    public botLocalDbService: BotLocalDbService,
    public usersLocalDbService: UsersLocalDbService,
    public router: Router,
    public wsRequestsService: WsRequestsService,
    public faqKbService: FaqKbService,
    public usersService: UsersService
  ) { }

  ngOnInit() {

  }


  // -----------------------------------------------------------------------------------------------------
  // @ Create the agent array from the request's participant id
  // -----------------------------------------------------------------------------------------------------
  createAgentsArrayFromParticipantsId(members_array: any, requester_id: string) {
    this.agents_array = [];
    this.cleaned_members_array = [];
    members_array.forEach(member_id => {
      // !== requester_id
      if (member_id && member_id !== 'system') {

        this.cleaned_members_array.push(member_id);
        // console.log('%%% WsRequestsMsgsComponent - CLEANED MEMBERS ARRAY ', this.cleaned_members_array);

        const memberIsBot = member_id.includes('bot_');

        if (memberIsBot === true) {

          const bot_id = member_id.slice(4);
          console.log('%%% WsRequestsMsgsComponent - THE PARTICIP', member_id, 'IS A BOT ', memberIsBot, ' - ID ', bot_id);

          const bot = this.botLocalDbService.getBotFromStorage(bot_id);
          if (bot) {

            this.agents_array.push({ '_id': 'bot_' + bot['_id'], 'firstname': bot['name'], 'isBot': true })

          } else {
            this.agents_array.push({ '_id': member_id, 'firstname': member_id, 'isBot': true })
          }

          // NON è UN BOT
        } else {
          console.log('%%% WsRequestsMsgsComponent - MEMBER ', member_id)

          // l'utente è salvato nello storage
          const user = this.usersLocalDbService.getMemberFromStorage(member_id);

          if (user) {
            if (member_id === user['_id']) {
              // tslint:disable-next-line:max-line-length
              this.agents_array.push({ '_id': user['_id'], 'firstname': user['firstname'], 'lastname': user['lastname'], 'isBot': false })

              // this.request.push(user)
              // console.log('--> THIS REQUEST - USER ', user)
            }
          } else {
            this.agents_array.push({ '_id': member_id, 'firstname': member_id, 'isBot': false })
          }
        }
      }
    });

    console.log('%%% WsRequestsMsgsComponent - AGENT ARRAY ', this.agents_array)
  }


  // -----------------------------------------------------------------------------------------------------
  // @ Create the requester avatar
  // -----------------------------------------------------------------------------------------------------
  createRequesterAvatar(lead) {

    if (lead && lead.fullname) {
      this.requester_fullname_initial = avatarPlaceholder(lead.fullname);
      this.fillColour = getColorBck(lead.fullname)
    } else {

      this.requester_fullname_initial = 'n.a.';
      this.fillColour = '#eeeeee';
    }

  }

  // -----------------------------------------------------------------------------------------------------
  // @ Extracts the values from the "attributes" object of the request and assign them to local variables
  // -----------------------------------------------------------------------------------------------------
  destructureAttributes(attributes: any) {
    if (attributes) {

      /**
       * attributes > userFullname
       */
      if (attributes.userFullname) {
        this.user_name = attributes.userFullname;
        console.log('* USER NAME: ', this.user_name);
      } else {
        this.user_name = 'n.a.'
      }

      /**
       * attributes > userEmail
       */
      if (attributes.userEmail) {
        this.user_email = attributes.userEmail;
        console.log('* USER EMAIL: ', this.user_email);
      } else {
        this.user_email = 'n.a.'
      }

      /**
       * attributes > departmentName
       */
      if (attributes.departmentName) {
        this.department_name = attributes.departmentName;
        console.log('* DEPATMENT NAME: ', this.department_name);
      } else {
        this.department_name = 'Default'
      }

      /**
       * attributes > departmentId
       */
      if (attributes.departmentId) {
        this.department_id = attributes.departmentId;
        console.log('* DEPATMENT ID: ', this.department_id);
      } else {
        this.department_id = 'n.a.'
      }

      /**
       * attributes > sourcePage
       */
      if (attributes.sourcePage) {
        this.source_page = attributes.sourcePage;
        console.log('* SOURCE PAGE: ', this.source_page);
      } else {
        this.source_page = 'n.a.'
        console.log('* SOURCE PAGE: ', this.source_page);
      }

    } else {
      this.user_name = 'n.a.';
      this.user_email = 'n.a.';
      this.department_name = 'n.a.';
      this.department_id = 'n.a.';
      this.source_page = 'n.a.';
    }

  }


  createFullParticipacipantsArray(participants: any) {
    // console.log('%%% Ws SHARED »»»»»»» getBotType participants ', participants);

    if (participants.length > 0) {

      this.newParticipants = []
      participants.forEach(participantid => {

        const participantIsBot = participantid.includes('bot_')

        if (participantIsBot === true) {

          const bot_id = participantid.slice(4);


          const bot = this.botLocalDbService.getBotFromStorage(bot_id);
          if (bot) {

            this.newParticipants.push([{ '_id': participantid, 'name': bot.name, 'lastname': '', 'botType': bot.type }])
            //   // '- ' +
            //   return member_id = bot['name'] + ' (bot)';
            // } else {
            //   // '- ' +
            //   return member_id

          } else {

            this.getBotFromRemoteAndSaveInStorage(bot_id, participantid)


          }

        } else {

          const user = this.usersLocalDbService.getMemberFromStorage(participantid);
          if (user) {
            console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray participants - user get from storage ', user);

            let lastnameInizial = ''
            if (user.lastname) {
              lastnameInizial = user['lastname'].charAt(0);
            }

            this.newParticipants.push([{ '_id': participantid, 'name': user.firstname, 'lastname': lastnameInizial, 'botType': '' }])
     
          } else {
            console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray participants - user NOT IN STORAGE ');

            this.getProjectuserByIdAndSaveInStorage(participantid);
          }
        }

      });


      console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray - newParticipants Array ', this.newParticipants);
      return this.newParticipants

    }
  }

  getBotFromRemoteAndSaveInStorage(bot_id: string, participantid: string) {

    this.faqKbService.getMongDbFaqKbById(bot_id).subscribe((res: any) => {
      console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getBotFromRemoteAndSaveInStorage - RES', res);

      this.newParticipants.push([{ '_id': participantid, 'name': res.name, 'lastname': '', 'botType': res.type }])

      this.botLocalDbService.saveBotsInStorage(bot_id, res);
    }, (error) => {

      console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getBotFromRemoteAndSaveInStorage - ERROR ', error);
    }, () => {
      console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getBotFromRemoteAndSaveInStorage * COMPLETE *');

    });

  }

  getProjectuserByIdAndSaveInStorage(userid) {
    // DONE -> WORKS NK-TO-TEST - da cambiare - vedi commento nel servizio
    //  this.usersService.getUsersById("5e3d47b485aa8a0017012485")
    this.usersService.getProjectUserById(userid)
      .subscribe((projectuser) => {
        console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getProjectuserByIdAndSaveInStorage - RES', projectuser);

      
        if (projectuser) {

          this.user = projectuser[0].id_user;

          let lastnameInizial = ''
          if (this.user.lastname) {
            lastnameInizial = this.user.lastname.charAt(0);
          }
          
          this.newParticipants.push([{ '_id': userid, 'name': this.user.firstname, 'lastname': lastnameInizial, 'botType': '' }])

          this.usersLocalDbService.saveMembersInStorage(userid, this.user);
        }
      }, (error) => {
        console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getProjectuserByIdAndSaveInStorage - ERROR ', error);
      }, () => {
        console.log('!! Ws SHARED »»»»»»» createFullParticipacipantsArray getProjectuserByIdAndSaveInStorage * COMPLETE *');
      });
  }



  currentUserIdIsInParticipants(participants: any, currentUserID: string, request_id): boolean {

    let currentUserIsJoined = false
    participants.forEach((participantID: string) => {

      if (participantID === currentUserID) {
        // console.log('%%% Ws SHARED »»»»»»» PARTICIPANTS ', participants)
        // console.log('%%% Ws SHARED »»»»»»» CURRENT_USER_ID ', currentUserID);
        currentUserIsJoined = true;
        // console.log('%%% Ws SHARED »»»»»»» CURRENT USER ', currentUserID, 'is JOINED ?', currentUserIsJoined, 'to the request ', request_id);
        return
      }
    });
    // console.log('%%% Ws SHARED »»»»»»» CURRENT USER ', currentUserID, ' is JOINED ?', currentUserIsJoined, 'to the request ', request_id);
    return currentUserIsJoined;
  }

  getParticipantsInRequests(ws_requests) {

    const participantsId = [];

    this.participantsInRequests = [];

    ws_requests.forEach(request => {

      request.participants.forEach(participant => {


        // WITH THE PURPOSE OF DISPLAYING IN THE "FILTER FOR AGENTS" ONLY THE AGENTS (WITHOUT DUPLICATES) THAT ARE PRESENT IN THE REQUESTS BELOW THE FILTER
        // I CREATE AN ARRAY OF IDS OF PARTICIPANTS:  participantsId
        // IF THE ID OF THE PARTICIPANT DOES NOT EXISTS IN THE "ARRAY participantsId" THE FOR CYCLE PROCEEDS BUILDING 
        // THE ARRAY participantsInRequests

        if (participantsId.indexOf(participant) === -1) {

          participantsId.push(participant);

          const participantIsBot = participant.includes('bot_')
          if (participantIsBot === true) {

            const bot_id = participant.slice(4);
            // console.log('!!! NEW REQUESTS HISTORY - THE PARTICIP', member_id, 'IS A BOT ', participantIsBot, ' - ID ', bot_id);

            const bot = this.botLocalDbService.getBotFromStorage(bot_id);
            // console.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests bot', bot);

            if (bot) {
              this.participantsInRequests.push({ '_id': participant, 'firstname': bot.name });
            } else {
              this.participantsInRequests.push({ '_id': participant, 'firstname': participant });
            }

          } else {

            const user = this.usersLocalDbService.getMemberFromStorage(participant);
            // console.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests user', user);

            if (user) {
              this.participantsInRequests.push({ '_id': participant, 'firstname': user.firstname, 'lastname': user.lastname })
            } else {

              this.participantsInRequests.push({ '_id': participant, 'firstname': participant, })
            }


          }
        }
      });
    });

    console.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests participantsId ', participantsId);
    console.log('% »»» WebSocketJs WF agentsArrayBuildFromRequests ', this.participantsInRequests);
  }


  // -----------------------------------------------------------------------------------------------------
  // @ departments in Requests & Count of depts in requests
  // -----------------------------------------------------------------------------------------------------

  /**
   * Count of depts in requests !! no more get from request attributes but from department
   * 
   * @param requests_array 
   */
  getDeptsAndCountOfDeptsInRequests(requests_array) {
    const depts_array = [];
    const deptsIDs = [];

    const deptsNames = [];

    requests_array.forEach((request, index) => {
      // if (request && request.attributes) {
      if (request && request.department) {
        // console.log('% WsRequestsList  - REQUEST ', request, '#', index);

        /**
         * CREATES AN ARRAY WITH ALL THE DEPTS RETURNED IN THE REQUESTS OBJCTS
         * (FROM THIS IS CREATED requestsDepts_uniqueArray)
         */

        // depts_array.push({ '_id': request.attributes.departmentId, 'deptName': request.attributes.departmentName }); 
        depts_array.push({ '_id': request.department._id, 'deptName': request.department.name });


        /**
         * CREATES AN ARRAY WITH * ONLY THE IDs * OF THE DEPTS RETURNED IN THE REQUESTS OBJCTS
         * THIS IS USED TO GET THE OCCURRENCE IN IT OF THE ID OF THE ARRAY this.requestsDepts_array
         */

        /**
         * USING DEPT ID  */
        // deptsIDs.push(request.attributes.departmentId)
        deptsIDs.push(request.department._id);

        /**
         * USING DEPT NAME  */
        // deptsNames.push(request.attributes.departmentName)
      } else {
        // console.log('REQUESTS-LIST COMP - REQUEST (else)', request, '#', index);

      }
    });
    // console.log('REQUESTS-LIST COMP - DEPTS ARRAY NK', depts_array);
    // console.log('REQUESTS-LIST COMP - DEPTS ID ARRAY NK', deptsIDs);
    // console.log('REQUESTS-LIST COMP - DEPTS NAME ARRAY NK', deptsNames)

    /**
     * *********************************************************************
     * ************************* REMOVE DUPLICATE **************************
     * *********************************************************************
     * */

    /**
     * USING DEPT ID  */
    this.depts_array_noduplicate = this.removeDuplicates(depts_array, '_id');

    /**
     * USING DEPT NAME  */
    //  this.depts_array_noduplicate = this.removeDuplicates(depts_array, 'deptName');

    console.log('% WsRequestsList - REQUESTSxDEPTS - DEPTS ARRAY [no duplicate] NK', this.depts_array_noduplicate)

    // GET OCCURRENCY OF THE DEPT ID IN THE ARRAY OF THE TOTAL DEPT ID
    this.depts_array_noduplicate.forEach(dept => {

      /**
       * USING DEPT ID  */
      this.getDeptIdOccurrence(deptsIDs, dept._id)

      /**
       * USING DEPT NAME  */
      // this.getDeptNameOccurrence(deptsNames, dept.deptName)
    });
  }

  removeDuplicates(originalArray, prop) {
    const newArray = [];
    const lookupObject = {};

    // tslint:disable-next-line:forin
    for (const i in originalArray) {
      lookupObject[originalArray[i][prop]] = originalArray[i];
    }

    // tslint:disable-next-line:forin
    for (const i in lookupObject) {
      newArray.push(lookupObject[i]);
    }
    return newArray;
  }

  getDeptIdOccurrence(array_of_all_depts_ids, dept_id) {
    // console.log('!!! ANALYTICS - ALL REQUESTS X DEPT - GET DEP OCCURRENCE FOR DEPTS ');
    const newUnicArray = []
    let count = 0;
    array_of_all_depts_ids.forEach((v) => (v === dept_id && count++));
    // console.log('% WsRequestsList - REQUESTSxDEPTS - DEPT - #', count, ' REQUESTS ASSIGNED TO DEPT ', dept_id);
    let i
    for (i = 0; i < this.depts_array_noduplicate.length; ++i) {

      for (const dept of this.depts_array_noduplicate) {
        if (dept_id === dept._id) {
          dept.requestsCount = count
        }
      }
      // console.log('% WsRequestsList - REQUESTSxDEPTS DEPTS ARRAY [no duplicate] NK * 2 * : ', this.depts_array_noduplicate);
    }
  }



  // ------------------------------------------------------------------------------------------------
  // MOVED FROM ws-requests-list.component.ts after the creation of the component  
  // WsRequestsUnservedComponent & WsRequestsServedComponent
  // ------------------------------------------------------------------------------------------------


  members_replace(member_id) {
    // console.log('!!! NEW REQUESTS HISTORY  - SERVED BY ID ', member_id)
    // console.log(' !!! NEW REQUESTS HISTORY underscore found in the participant id  ', member_id, member_id.includes('bot_'));

    const participantIsBot = member_id.includes('bot_')

    if (participantIsBot === true) {

      const bot_id = member_id.slice(4);
      // console.log('!!! NEW REQUESTS HISTORY - THE PARTICIP', member_id, 'IS A BOT ', participantIsBot, ' - ID ', bot_id);

      const bot = this.botLocalDbService.getBotFromStorage(bot_id);
      if (bot) {
        // '- ' +
        return member_id = bot['name'] + ' (bot)';
      } else {
        // '- ' +
        return member_id
      }

    } else {

      const user = this.usersLocalDbService.getMemberFromStorage(member_id);
      if (user) {
        // console.log('user ', user)
        const lastnameInizial = user['lastname'].charAt(0);
        // '- ' +
        return member_id = user['firstname'] + ' ' + lastnameInizial + '.'
      } else {
        // '- ' +
        return member_id
      }
    }
  }





  getRequestText(text: string): string {
    if (text) {
      return text.length >= 30 ?
        text.slice(0, 30) + '...' :
        text;
    }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Train bot sidebar
  // -----------------------------------------------------------------------------------------------------

  openRightSideBar(message: string) {
    this.OPEN_RIGHT_SIDEBAR = true;
    console.log('»»»» OPEN RIGHT SIDEBAR ', this.OPEN_RIGHT_SIDEBAR, ' MSG: ', message);
    this.selectedQuestion = message;


    // questo non funziona se è commented BUG RESOLVE
    const elemMainContent = <HTMLElement>document.querySelector('.main-content');
    this.train_bot_sidebar_height = elemMainContent.clientHeight + 10 + 'px'
    console.log('REQUEST-MSGS - ON OPEN RIGHT SIDEBAR -> RIGHT SIDEBAR HEIGHT', this.train_bot_sidebar_height);

  }


  joinDeptAndLeaveCurrentAgents(deptid_selected, requestid) {
    console.log('REQUEST-MSGS - JOIN DEPT AND LEAVE CURRENT AGENTS - DEPT ID ', deptid_selected);
    this.wsRequestsService.joinDept(deptid_selected, requestid)
      .subscribe((res: any) => {
        console.log('REQUEST-MSGS - JOIN DEPT - RES ', res);
      }, (error) => {
        console.log('REQUEST-MSGS - JOIN DEPT - RES - ERROR ', error);
      }, () => {
        console.log('REQUEST-MSGS - JOIN DEPT - RES * COMPLETE *');
      });
  }

}
