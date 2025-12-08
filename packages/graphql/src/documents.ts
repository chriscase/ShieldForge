/**
 * GraphQL query and mutation documents for Apollo Client
 * These can be used directly with Apollo Client's useQuery and useMutation hooks
 */

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      user {
        id
        email
        username
        name
        accountStatus
        emailVerified
        createdAt
        updatedAt
      }
      token
    }
  }
`;

export const REGISTER_MUTATION = `
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      user {
        id
        email
        username
        name
        accountStatus
        emailVerified
        createdAt
        updatedAt
      }
      token
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      email
      username
      name
      accountStatus
      emailVerified
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      username
      name
      accountStatus
      emailVerified
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_PASSWORD_MUTATION = `
  mutation UpdatePassword($input: UpdatePasswordInput!) {
    updatePassword(input: $input)
  }
`;

export const REQUEST_PASSWORD_RESET_MUTATION = `
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($code: String!, $newPassword: String!) {
    resetPassword(code: $code, newPassword: $newPassword)
  }
`;

export const CHECK_PASSWORD_STRENGTH_QUERY = `
  query CheckPasswordStrength($password: String!) {
    checkPasswordStrength(password: $password) {
      score
      feedback
    }
  }
`;

/**
 * Fragment for User fields
 * Can be composed into other queries
 */
export const USER_FIELDS_FRAGMENT = `
  fragment UserFields on User {
    id
    email
    username
    name
    accountStatus
    emailVerified
    createdAt
    updatedAt
  }
`;

/**
 * Fragment for AuthPayload fields
 */
export const AUTH_PAYLOAD_FRAGMENT = `
  fragment AuthPayloadFields on AuthPayload {
    user {
      ...UserFields
    }
    token
  }
  ${USER_FIELDS_FRAGMENT}
`;
