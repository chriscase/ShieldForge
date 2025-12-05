import { gql } from '@apollo/client';

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      createdAt
      updatedAt
    }
  }
`;

export const HEALTH_QUERY = gql`
  query Health {
    health
  }
`;
