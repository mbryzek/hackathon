import * as url from 'url';

declare namespace com.bryzek.platform.error.v0.models {
  interface UnauthorizedError {
    readonly 'discriminator': 'unauthorized';
    readonly 'message': string;
  }

  interface ValidationError {
    readonly 'discriminator': 'validation';
    readonly 'message': string;
    readonly 'field'?: string;
  }
}

declare namespace com.bryzek.platform.error.v0.unions {
  type PlatformError = (com.bryzek.platform.error.v0.models.ValidationError | com.bryzek.platform.error.v0.models.UnauthorizedError);
}

declare namespace com.bryzek.vote.api.v0.enums {
  type EventStatus = 'draft' | 'open' | 'closed';
  type VoterType = 'student' | 'parent';
}

declare namespace com.bryzek.vote.api.v0.models {
  interface CodeVerificationForm {
    readonly 'code': string;
  }

  interface Event {
    readonly 'id': string;
    readonly 'key': string;
    readonly 'name': string;
    readonly 'status': com.bryzek.vote.api.v0.enums.EventStatus;
    readonly 'created_at': string;
    readonly 'updated_at': string;
  }

  interface EventReference {
    readonly 'id': string;
  }

  interface Project {
    readonly 'id': string;
    readonly 'event': com.bryzek.vote.api.v0.models.EventReference;
    readonly 'name': string;
    readonly 'description'?: string;
    readonly 'position': number;
    readonly 'created_at': string;
    readonly 'updated_at': string;
  }

  interface ProjectVote {
    readonly 'project': com.bryzek.vote.api.v0.models.Project;
    readonly 'selected': boolean;
  }

  interface Vote {
    readonly 'voter_type': com.bryzek.vote.api.v0.enums.VoterType;
    readonly 'max_votes': number;
    readonly 'event': com.bryzek.vote.api.v0.models.Event;
    readonly 'projects': com.bryzek.vote.api.v0.models.ProjectVote[];
  }

  interface VoteForm {
    readonly 'code': string;
    readonly 'project_ids': string[];
  }
}

declare namespace com.bryzek.platform.v0.enums {
  type Consent = 'opted_in' | 'opted_out' | 'pending';
  type Environment = 'production' | 'sandbox';
  type Gender = 'male' | 'female' | 'other';
  type TimeZone = 'america_new_york' | 'america_chicago' | 'america_denver' | 'america_los_angeles' | 'america_phoenix' | 'america_anchorage' | 'pacific_honolulu' | 'america_halifax' | 'america_st_johns' | 'america_mexico_city' | 'america_cancun' | 'europe_london' | 'europe_paris' | 'europe_helsinki' | 'europe_moscow' | 'europe_istanbul' | 'asia_tokyo' | 'asia_seoul' | 'asia_shanghai' | 'asia_hong_kong' | 'asia_singapore' | 'asia_bangkok' | 'asia_jakarta' | 'asia_manila' | 'asia_kuala_lumpur' | 'asia_kolkata' | 'asia_karachi' | 'asia_dubai' | 'asia_tehran' | 'australia_sydney' | 'australia_brisbane' | 'australia_perth' | 'australia_adelaide' | 'australia_darwin' | 'pacific_auckland' | 'pacific_fiji' | 'america_sao_paulo' | 'america_argentina_buenos_aires' | 'america_santiago' | 'america_lima' | 'america_bogota' | 'america_caracas' | 'africa_cairo' | 'africa_lagos' | 'africa_johannesburg' | 'africa_nairobi' | 'africa_casablanca' | 'utc';
  type UserRole = 'admin' | 'user';
  type UserStatus = 'pending' | 'active' | 'inactive';
}

declare namespace com.bryzek.platform.v0.models {
  interface BirthInfo {
    readonly 'month': number;
    readonly 'year': number;
  }

  interface BirthInfoForm {
    readonly 'month': number;
    readonly 'year': number;
  }

  interface Email {
    readonly 'id': string;
    readonly 'address': string;
    readonly 'verified_at'?: string;
  }

  interface EmailVerification {}

  interface LoginForm {
    readonly 'email': string;
    readonly 'password': string;
  }

  interface MobilePhoneForm {
    readonly 'number': string;
    readonly 'optin_to_sms'?: boolean;
    readonly 'allowed_to_share'?: boolean;
  }

  interface Money {
    readonly 'amount': number;
    readonly 'currency': string;
  }

  interface PasswordChangeForm {
    readonly 'id': string;
    readonly 'password': string;
  }

  interface PasswordResetForm {
    readonly 'email': string;
  }

  interface Phone {
    readonly 'id': string;
    readonly 'number': string;
    readonly 'consent': com.bryzek.platform.v0.enums.Consent;
  }

  interface PrivateDinkersUserData {
    readonly 'dupr': number;
  }

  interface PrivateDinkersUserDataForm {
    readonly 'dupr': number;
  }

  interface SessionReference {
    readonly 'id': string;
  }

  interface SignupForm {
    readonly 'user': com.bryzek.platform.v0.models.UserForm;
    readonly 'password': string;
  }

  interface TenantReference {
    readonly 'id': string;
  }

  interface TenantSession {
    readonly 'discriminator': 'tenant_session';
    readonly 'session': com.bryzek.platform.v0.models.SessionReference;
    readonly 'user': com.bryzek.platform.v0.models.User;
  }

  interface User {
    readonly 'id': string;
    readonly 'tenant': com.bryzek.platform.v0.models.TenantReference;
    readonly 'email': com.bryzek.platform.v0.models.Email;
    readonly 'name'?: string;
    readonly 'nickname'?: string;
    readonly 'birth'?: com.bryzek.platform.v0.models.BirthInfo;
    readonly 'gender'?: com.bryzek.platform.v0.enums.Gender;
    readonly 'status': com.bryzek.platform.v0.enums.UserStatus;
    readonly 'role': com.bryzek.platform.v0.enums.UserRole;
    readonly 'mobile_phone'?: com.bryzek.platform.v0.models.Phone;
    readonly 'time_zone': com.bryzek.platform.v0.enums.TimeZone;
    readonly 'private_dinkers'?: com.bryzek.platform.v0.models.PrivateDinkersUserData;
  }

  interface UserForm {
    readonly 'email': string;
    readonly 'name'?: string;
    readonly 'nickname'?: string;
    readonly 'birth'?: com.bryzek.platform.v0.models.BirthInfoForm;
    readonly 'gender'?: com.bryzek.platform.v0.enums.Gender;
    readonly 'mobile_phone'?: com.bryzek.platform.v0.models.MobilePhoneForm;
    readonly 'time_zone'?: com.bryzek.platform.v0.enums.TimeZone;
    readonly 'private_dinkers'?: com.bryzek.platform.v0.models.PrivateDinkersUserDataForm;
  }

  interface UserInactive {
    readonly 'discriminator': 'user_inactive';
    readonly 'status': com.bryzek.platform.v0.enums.UserStatus;
  }

  interface UserPasswordForm {
    readonly 'current_password': string;
    readonly 'new_password': string;
  }

  interface UserPasswordSuggestion {
    readonly 'password': string;
  }

  interface UserReference {
    readonly 'id': string;
  }

  interface UserSecondaryForm {
    readonly 'birth'?: com.bryzek.platform.v0.models.BirthInfoForm;
    readonly 'gender'?: com.bryzek.platform.v0.enums.Gender;
    readonly 'time_zone'?: com.bryzek.platform.v0.enums.TimeZone;
    readonly 'private_dinkers'?: com.bryzek.platform.v0.models.PrivateDinkersUserDataForm;
  }
}

declare namespace com.bryzek.platform.v0.unions {
  type SessionState = (com.bryzek.platform.v0.models.TenantSession | com.bryzek.platform.v0.models.UserInactive);
}

declare namespace com.bryzek.vote.admin.v0.models {
  interface AdminSession {
    readonly 'session': com.bryzek.platform.v0.models.SessionReference;
    readonly 'user': com.bryzek.platform.v0.models.User;
  }

  interface Code {
    readonly 'id': string;
    readonly 'event': com.bryzek.vote.api.v0.models.EventReference;
    readonly 'code': string;
    readonly 'voter_type': com.bryzek.vote.api.v0.enums.VoterType;
    readonly 'has_voted': boolean;
    readonly 'created_at': string;
  }

  interface CodeGenerateForm {
    readonly 'voter_type': com.bryzek.vote.api.v0.enums.VoterType;
    readonly 'count': number;
  }

  interface EventForm {
    readonly 'key': string;
    readonly 'name': string;
    readonly 'status'?: com.bryzek.vote.api.v0.enums.EventStatus;
  }

  interface EventResults {
    readonly 'event': com.bryzek.vote.api.v0.models.Event;
    readonly 'student': com.bryzek.vote.admin.v0.models.Tally;
    readonly 'parent': com.bryzek.vote.admin.v0.models.Tally;
  }

  interface ProjectForm {
    readonly 'name': string;
    readonly 'description'?: string;
  }

  interface ProjectReorderForm {
    readonly 'project_ids': string[];
  }

  interface ProjectTally {
    readonly 'project': com.bryzek.vote.api.v0.models.Project;
    readonly 'vote_count': number;
  }

  interface Tally {
    readonly 'total_votes': number;
    readonly 'projects': com.bryzek.vote.admin.v0.models.ProjectTally[];
  }
}

export type AdminSession = com.bryzek.vote.admin.v0.models.AdminSession;
export type Code = com.bryzek.vote.admin.v0.models.Code;
export type CodeGenerateForm = com.bryzek.vote.admin.v0.models.CodeGenerateForm;
export type EventForm = com.bryzek.vote.admin.v0.models.EventForm;
export type EventResults = com.bryzek.vote.admin.v0.models.EventResults;
export type ProjectForm = com.bryzek.vote.admin.v0.models.ProjectForm;
export type ProjectReorderForm = com.bryzek.vote.admin.v0.models.ProjectReorderForm;
export type ProjectTally = com.bryzek.vote.admin.v0.models.ProjectTally;
export type Tally = com.bryzek.vote.admin.v0.models.Tally;

export interface $FetchOptions {
  body?: string;
  headers?: $HttpHeaders;
  method?: $HttpMethod;
}

export type $FetchFunction = (url: string, options?: $FetchOptions) => Promise<Response>;

export interface $HttpHeaders {
  [key: string]: string;
}

export type $HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'CONNECT' | 'OPTIONS' | 'TRACE';

export interface $HttpQuery {
  [key: string]: string | number | boolean | string[] | number[] | boolean[] | undefined | null;
}

export interface $HttpRequest {
  body?: any;
  url: string;
  headers: $HttpHeaders;
  method: $HttpMethod;
}

export interface $HttpRequestOptions {
  body?: any;
  endpoint: string;
  headers?: $HttpHeaders;
  method: $HttpMethod;
  query?: $HttpQuery;
}

export interface $HttpResponse<B = any, S = number, O = boolean> {
  body: B;
  headers: $HttpHeaders;
  ok: O;
  request: $HttpRequest;
  status: S;
  statusText: string;
}

export type $HttpContinue<T> = $HttpResponse<T, 100, false>;
export type $HttpSwitchingProtocol<T> = $HttpResponse<T, 101, false>;
export type $HttpProcessing<T> = $HttpResponse<T, 102, false>;
export type $HttpOk<T> = $HttpResponse<T, 200, true>;
export type $HttpCreated<T> = $HttpResponse<T, 201, true>;
export type $HttpAccepted<T> = $HttpResponse<T, 202, true>;
export type $HttpNonAuthoritativeInformation<T> = $HttpResponse<T, 203, true>;
export type $HttpNoContent<T> = $HttpResponse<T, 204, true>;
export type $HttpResetContent<T> = $HttpResponse<T, 205, true>;
export type $HttpPartialContent<T> = $HttpResponse<T, 206, true>;
export type $HttpMultiStatus<T> = $HttpResponse<T, 207, true>;
export type $HttpAlreadyReported<T> = $HttpResponse<T, 208, true>;
export type $HttpImUsed<T> = $HttpResponse<T, 226, true>;
export type $HttpMultipleChoices<T> = $HttpResponse<T, 300, false>;
export type $HttpMovedPermanently<T> = $HttpResponse<T, 301, false>;
export type $HttpFound<T> = $HttpResponse<T, 302, false>;
export type $HttpSeeOther<T> = $HttpResponse<T, 303, false>;
export type $HttpNotModified<T> = $HttpResponse<T, 304, false>;
export type $HttpUseProxy<T> = $HttpResponse<T, 305, false>;
export type $HttpTemporaryRedirect<T> = $HttpResponse<T, 307, false>;
export type $HttpPermanentRedirect<T> = $HttpResponse<T, 308, false>;
export type $HttpBadRequest<T> = $HttpResponse<T, 400, false>;
export type $HttpUnauthorized<T> = $HttpResponse<T, 401, false>;
export type $HttpPaymentRequired<T> = $HttpResponse<T, 402, false>;
export type $HttpForbidden<T> = $HttpResponse<T, 403, false>;
export type $HttpNotFound<T> = $HttpResponse<T, 404, false>;
export type $HttpMethodNotAllowed<T> = $HttpResponse<T, 405, false>;
export type $HttpNotAcceptable<T> = $HttpResponse<T, 406, false>;
export type $HttpProxyAuthenticationRequired<T> = $HttpResponse<T, 407, false>;
export type $HttpRequestTimeout<T> = $HttpResponse<T, 408, false>;
export type $HttpConflict<T> = $HttpResponse<T, 409, false>;
export type $HttpGone<T> = $HttpResponse<T, 410, false>;
export type $HttpLengthRequired<T> = $HttpResponse<T, 411, false>;
export type $HttpPreconditionFailed<T> = $HttpResponse<T, 412, false>;
export type $HttpRequestEntityTooLarge<T> = $HttpResponse<T, 413, false>;
export type $HttpRequestUriTooLong<T> = $HttpResponse<T, 414, false>;
export type $HttpUnsupportedMediaType<T> = $HttpResponse<T, 415, false>;
export type $HttpRequestedRangeNotSatisfiable<T> = $HttpResponse<T, 416, false>;
export type $HttpExpectationFailed<T> = $HttpResponse<T, 417, false>;
export type $HttpMisdirectedRequest<T> = $HttpResponse<T, 421, false>;
export type $HttpUnprocessableEntity<T> = $HttpResponse<T, 422, false>;
export type $HttpLocked<T> = $HttpResponse<T, 423, false>;
export type $HttpFailedDependency<T> = $HttpResponse<T, 424, false>;
export type $HttpUpgradeRequired<T> = $HttpResponse<T, 426, false>;
export type $HttpPreconditionRequired<T> = $HttpResponse<T, 428, false>;
export type $HttpTooManyRequests<T> = $HttpResponse<T, 429, false>;
export type $HttpRequestHeaderFieldsTooLarge<T> = $HttpResponse<T, 431, false>;
export type $HttpNoResponse<T> = $HttpResponse<T, 444, false>;
export type $HttpRetryWith<T> = $HttpResponse<T, 449, false>;
export type $HttpBlockedByWindowsParentalControls<T> = $HttpResponse<T, 450, false>;
export type $HttpUnavailableForLegalReasons<T> = $HttpResponse<T, 451, false>;
export type $HttpClientClosedRequest<T> = $HttpResponse<T, 499, false>;
export type $HttpInternalServerError<T> = $HttpResponse<T, 500, false>;
export type $HttpNotImplemented<T> = $HttpResponse<T, 501, false>;
export type $HttpBadGateway<T> = $HttpResponse<T, 502, false>;
export type $HttpServiceUnavailable<T> = $HttpResponse<T, 503, false>;
export type $HttpGatewayTimeout<T> = $HttpResponse<T, 504, false>;
export type $HttpHttpVersionNotSupported<T> = $HttpResponse<T, 505, false>;
export type $HttpInsufficientStorage<T> = $HttpResponse<T, 507, false>;
export type $HttpLoopDetected<T> = $HttpResponse<T, 508, false>;
export type $HttpBandwidthLimitExceeded<T> = $HttpResponse<T, 509, false>;
export type $HttpNotExtended<T> = $HttpResponse<T, 510, false>;
export type $HttpNetworkAuthenticationRequired<T> = $HttpResponse<T, 511, false>;
export type $HttpNetworkReadTimeoutError<T> = $HttpResponse<T, 598, false>;
export type $HttpNetworkConnectTimeoutError<T> = $HttpResponse<T, 599, false>;

export interface $HttpClientOptions {
  fetch: $FetchFunction;
}

export function isResponseEmpty(response: Response): boolean {
  const contentLength = response.headers.get('Content-Length');
  return response.status === 204 || contentLength != null && Number.parseInt(contentLength, 10) === 0;
}

export function isResponseJson(response: Response): boolean {
  const contentType = response.headers.get('Content-Type');
  return contentType != null && contentType.indexOf('json') >= 0;
}

export function parseJson(response: Response): Promise<any> {
  return !isResponseEmpty(response) && isResponseJson(response) ? response.json() : Promise.resolve();
}

export function parseHeaders(response: Response): Record<string, string> {
  const headers: Record<string, string> = {};

  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  return headers;
}

export function stripQuery(query: $HttpQuery = {}): $HttpQuery {
  const initialValue: $HttpQuery = {};

  return Object.keys(query).reduce((previousValue, key) => {
    const value = query[key];

    if (value != null)
      previousValue[key] = value;

    return previousValue;
  }, initialValue);
}

export class $HttpClient {
  private options: $HttpClientOptions;

  constructor(options: $HttpClientOptions) {
    this.options = options;
  }

  public request(options: $HttpRequestOptions): Promise<$HttpResponse<any, any, any>> {
    const finalUrl: string = url.format({
      hostname: 'api.bthackathon.com',
      pathname: options.endpoint,
      protocol: 'https:',
      query: stripQuery(options.query),
    });

    const finalHeaders: $HttpHeaders = {
      accept: 'application/json',
      'content-type': 'application/json',
      ...options.headers,
    };

    const request: $HttpRequest = {
      body: options.body,
      headers: finalHeaders,
      method: options.method,
      url: finalUrl,
    };

    return this.options.fetch(request.url, {
      body: JSON.stringify(request.body),
      headers: request.headers,
      method: request.method,
    }).then((response) => {
      return parseJson(response).then((json) => {
        return {
          body: json,
          headers: parseHeaders(response),
          ok: response.ok,
          request,
          status: response.status,
          statusText: response.statusText,
        };
      });
    });
  }
}

export class $Resource {
  protected client: $HttpClient;

  constructor(options: $HttpClientOptions) {
    this.client = new $HttpClient(options);
  }
}

export interface AdminSessionsGetSessionParameters {
  headers?: $HttpHeaders;
}

export interface AdminSessionsPostSessionsAndLoginsParameters {
  body: com.bryzek.platform.v0.models.LoginForm;
  headers?: $HttpHeaders;
}

export interface AdminSessionsDeleteSessionParameters {
  headers?: $HttpHeaders;
}

export interface CodesGetParameters {
  headers?: $HttpHeaders;
  event_id: string;
  voter_type?: com.bryzek.vote.api.v0.enums.VoterType;
  has_voted?: boolean;
  limit?: number;
  offset?: number;
}

export interface CodesPostGenerateParameters {
  body: com.bryzek.vote.admin.v0.models.CodeGenerateForm;
  headers?: $HttpHeaders;
  event_id: string;
}

export interface CodesDeleteByIdParameters {
  headers?: $HttpHeaders;
  event_id: string;
  id: string;
}

export interface EventsGetParameters {
  headers?: $HttpHeaders;
  id?: string[];
  status?: com.bryzek.vote.api.v0.enums.EventStatus[];
  limit?: number;
  offset?: number;
}

export interface EventsGetByIdParameters {
  headers?: $HttpHeaders;
  id: string;
}

export interface EventsPostParameters {
  body: com.bryzek.vote.admin.v0.models.EventForm;
  headers?: $HttpHeaders;
}

export interface EventsPutByIdParameters {
  body: com.bryzek.vote.admin.v0.models.EventForm;
  headers?: $HttpHeaders;
  id: string;
}

export interface EventsDeleteByIdParameters {
  headers?: $HttpHeaders;
  id: string;
}

export interface ProjectsGetParameters {
  headers?: $HttpHeaders;
  event_id: string;
  limit?: number;
  offset?: number;
}

export interface ProjectsGetByIdParameters {
  headers?: $HttpHeaders;
  event_id: string;
  id: string;
}

export interface ProjectsPostParameters {
  body: com.bryzek.vote.admin.v0.models.ProjectForm;
  headers?: $HttpHeaders;
  event_id: string;
}

export interface ProjectsPutByIdParameters {
  body: com.bryzek.vote.admin.v0.models.ProjectForm;
  headers?: $HttpHeaders;
  event_id: string;
  id: string;
}

export interface ProjectsDeleteByIdParameters {
  headers?: $HttpHeaders;
  event_id: string;
  id: string;
}

export interface ProjectsPostReorderParameters {
  body: com.bryzek.vote.admin.v0.models.ProjectReorderForm;
  headers?: $HttpHeaders;
  event_id: string;
}

export interface EventResultsGetParameters {
  headers?: $HttpHeaders;
  event_id: string;
}

export type AdminSessionsGetSessionResponse = $HttpOk<com.bryzek.vote.admin.v0.models.AdminSession> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]>;
export type AdminSessionsPostSessionsAndLoginsResponse = $HttpCreated<com.bryzek.vote.admin.v0.models.AdminSession> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type AdminSessionsDeleteSessionResponse = $HttpNoContent<undefined> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]>;
export type CodesGetResponse = $HttpOk<com.bryzek.vote.admin.v0.models.Code[]> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type CodesPostGenerateResponse = $HttpNoContent<undefined> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type CodesDeleteByIdResponse = $HttpNoContent<undefined> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type EventsGetResponse = $HttpOk<com.bryzek.vote.api.v0.models.Event[]> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type EventsGetByIdResponse = $HttpOk<com.bryzek.vote.api.v0.models.Event> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined>;
export type EventsPostResponse = $HttpCreated<com.bryzek.vote.api.v0.models.Event> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type EventsPutByIdResponse = $HttpOk<com.bryzek.vote.api.v0.models.Event> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type EventsDeleteByIdResponse = $HttpNoContent<undefined> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined>;
export type ProjectsGetResponse = $HttpOk<com.bryzek.vote.api.v0.models.Project[]> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type ProjectsGetByIdResponse = $HttpOk<com.bryzek.vote.api.v0.models.Project> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined>;
export type ProjectsPostResponse = $HttpCreated<com.bryzek.vote.api.v0.models.Project> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type ProjectsPutByIdResponse = $HttpOk<com.bryzek.vote.api.v0.models.Project> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type ProjectsDeleteByIdResponse = $HttpNoContent<undefined> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined>;
export type ProjectsPostReorderResponse = $HttpNoContent<undefined> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type EventResultsGetResponse = $HttpOk<com.bryzek.vote.admin.v0.models.EventResults> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpNotFound<undefined>;

export class AdminSessionsResource extends $Resource {
  /*Get current admin session*/
  public getSession(params: AdminSessionsGetSessionParameters = {}): Promise<AdminSessionsGetSessionResponse> {
    return this.client.request({
      endpoint: '/vote/admin/session',
      headers: params.headers,
      method: 'GET',
    });
  }

  /*Login to admin*/
  public postSessionsAndLogins(params: AdminSessionsPostSessionsAndLoginsParameters): Promise<AdminSessionsPostSessionsAndLoginsResponse> {
    return this.client.request({
      body: params.body,
      endpoint: '/vote/admin/sessions/logins',
      headers: params.headers,
      method: 'POST',
    });
  }

  /*Logout*/
  public deleteSession(params: AdminSessionsDeleteSessionParameters = {}): Promise<AdminSessionsDeleteSessionResponse> {
    return this.client.request({
      endpoint: '/vote/admin/session',
      headers: params.headers,
      method: 'DELETE',
    });
  }
}

export class CodesResource extends $Resource {
  public get(params: CodesGetParameters): Promise<CodesGetResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/codes`,
      headers: params.headers,
      method: 'GET',

      query: {
        has_voted: params.has_voted,
        limit: params.limit,
        offset: params.offset,
        voter_type: params.voter_type,
      },
    });
  }

  public postGenerate(params: CodesPostGenerateParameters): Promise<CodesPostGenerateResponse> {
    return this.client.request({
      body: params.body,
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/codes/generate`,
      headers: params.headers,
      method: 'POST',
    });
  }

  public deleteById(params: CodesDeleteByIdParameters): Promise<CodesDeleteByIdResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/codes/${encodeURIComponent(params.id)}`,
      headers: params.headers,
      method: 'DELETE',
    });
  }
}

export class EventsResource extends $Resource {
  public get(params: EventsGetParameters): Promise<EventsGetResponse> {
    return this.client.request({
      endpoint: '/vote/admin/events',
      headers: params.headers,
      method: 'GET',

      query: {
        id: params.id,
        limit: params.limit,
        offset: params.offset,
        status: params.status,
      },
    });
  }

  public getById(params: EventsGetByIdParameters): Promise<EventsGetByIdResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.id)}`,
      headers: params.headers,
      method: 'GET',
    });
  }

  public post(params: EventsPostParameters): Promise<EventsPostResponse> {
    return this.client.request({
      body: params.body,
      endpoint: '/vote/admin/events',
      headers: params.headers,
      method: 'POST',
    });
  }

  public putById(params: EventsPutByIdParameters): Promise<EventsPutByIdResponse> {
    return this.client.request({
      body: params.body,
      endpoint: `/vote/admin/events/${encodeURIComponent(params.id)}`,
      headers: params.headers,
      method: 'PUT',
    });
  }

  public deleteById(params: EventsDeleteByIdParameters): Promise<EventsDeleteByIdResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.id)}`,
      headers: params.headers,
      method: 'DELETE',
    });
  }
}

export class ProjectsResource extends $Resource {
  public get(params: ProjectsGetParameters): Promise<ProjectsGetResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/projects`,
      headers: params.headers,
      method: 'GET',

      query: {
        limit: params.limit,
        offset: params.offset,
      },
    });
  }

  public getById(params: ProjectsGetByIdParameters): Promise<ProjectsGetByIdResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/projects/${encodeURIComponent(params.id)}`,
      headers: params.headers,
      method: 'GET',
    });
  }

  public post(params: ProjectsPostParameters): Promise<ProjectsPostResponse> {
    return this.client.request({
      body: params.body,
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/projects`,
      headers: params.headers,
      method: 'POST',
    });
  }

  public putById(params: ProjectsPutByIdParameters): Promise<ProjectsPutByIdResponse> {
    return this.client.request({
      body: params.body,
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/projects/${encodeURIComponent(params.id)}`,
      headers: params.headers,
      method: 'PUT',
    });
  }

  public deleteById(params: ProjectsDeleteByIdParameters): Promise<ProjectsDeleteByIdResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/projects/${encodeURIComponent(params.id)}`,
      headers: params.headers,
      method: 'DELETE',
    });
  }

  public postReorder(params: ProjectsPostReorderParameters): Promise<ProjectsPostReorderResponse> {
    return this.client.request({
      body: params.body,
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/projects/reorder`,
      headers: params.headers,
      method: 'POST',
    });
  }
}

export class EventResultsResource extends $Resource {
  /*Get voting results for an event, sorted by vote count descending*/
  public get(params: EventResultsGetParameters): Promise<EventResultsGetResponse> {
    return this.client.request({
      endpoint: `/vote/admin/events/${encodeURIComponent(params.event_id)}/results`,
      headers: params.headers,
      method: 'GET',
    });
  }
}

export interface ClientInstance {
  adminSessions: AdminSessionsResource;
  codes: CodesResource;
  events: EventsResource;
  projects: ProjectsResource;
  eventResults: EventResultsResource;
}

export function createClient(options: $HttpClientOptions): ClientInstance {
  return {
    adminSessions: new AdminSessionsResource(options),
    codes: new CodesResource(options),
    events: new EventsResource(options),
    projects: new ProjectsResource(options),
    eventResults: new EventResultsResource(options),
  };
}