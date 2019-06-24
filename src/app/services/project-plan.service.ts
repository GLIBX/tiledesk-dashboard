import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { AuthService } from '../core/auth.service';
import { ProjectService } from '../services/project.service';

import { Project } from '../models/project-model';
@Injectable()

export class ProjectPlanService {

  public projectPlan: BehaviorSubject<Project> = new BehaviorSubject<Project>(null);

  projectID: string;

  constructor(
    private router: Router,
    private auth: AuthService,
    private projectService: ProjectService
  ) {

    // this.getCurrentProject();
    this.ckeckProjrctPlan();


  }

  getCurrentProject() {
    this.auth.project_bs.subscribe((project) => {

      if (project) {
        this.projectID = project._id;
        console.log('ProjectPlanService subscribe to project_bs - projectID', this.projectID)
      }

    });
  }

  ckeckProjrctPlan() {

    this.router.events.subscribe((ev) => {
      if (ev instanceof NavigationEnd) {

       
        const current_url = ev.url
        console.log('ProjectPlanService - NavigationEnd current_url', current_url);
        const url_segments = current_url.split('/');
        console.log('ProjectPlanService - CURRENT URL SEGMENTS ', url_segments);
        const nav_project_id = url_segments[2];
        console.log('ProjectPlanService - nav_project_id ', nav_project_id);

        if (nav_project_id && nav_project_id !== 'email' && url_segments[1] !== 'user') {
          this.getProjectByID(nav_project_id)
        }

        // nav_project_id IS UNDEFINED IN THE LOGIN PAGE - IN THE PROJECT LIST PAGE
        // IN THE PAGE IN WICH THE  nav_project_id IS UNDEFINED SET TO NULL THE VALUE PUBLISHED BY projectPlan
        if (nav_project_id === undefined ) {

          this.projectPlan.next(null);
        }

      }
      // this.projectPlan.next('»»»»»»»»»   change of route »»»»»»»»»');


    });
  }

  getProjectByID(nav_project_id: string) {

    this.projectService.getProjectById(nav_project_id).subscribe((project: any) => {
      console.log('ProjectPlanService - getProjectByID * project ', project);

      const projectPlanData: Project = {

        _id:  project._id,
        profile_name: project.profile['name'],
        profile_agents: project.profile['agents'],
        trial_days: project.profile['trialDays'],
        trial_days_left: project.trialDaysLeft,
        trial_expired: project.trialExpired,
      }

      this.projectPlan.next(projectPlanData);

    }, error => {
      console.log('ProjectPlanService - getProjectByID * error ', error);
    }, () => {
      console.log('ProjectPlanService - getProjectByID * complete ');
    });
  }



}