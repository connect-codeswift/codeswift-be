import type { Schema, Struct } from '@strapi/strapi';

export interface JobApplicationEducation extends Struct.ComponentSchema {
  collectionName: 'components_job_application_educations';
  info: {
    displayName: 'education';
  };
  attributes: {
    degree: Schema.Attribute.String;
    endYear: Schema.Attribute.String;
    institution: Schema.Attribute.String;
    startYear: Schema.Attribute.String;
  };
}

export interface JobApplicationExperience extends Struct.ComponentSchema {
  collectionName: 'components_job_application_experiences';
  info: {
    displayName: 'experience';
  };
  attributes: {
    company: Schema.Attribute.String;
    endDate: Schema.Attribute.String;
    startDate: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'job-application.education': JobApplicationEducation;
      'job-application.experience': JobApplicationExperience;
    }
  }
}
