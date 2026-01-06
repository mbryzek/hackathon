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
  interface CodeVerification {
    readonly 'voter_type': com.bryzek.vote.api.v0.enums.VoterType;
    readonly 'max_votes': number;
    readonly 'event': com.bryzek.vote.api.v0.models.Event;
    readonly 'projects': com.bryzek.vote.api.v0.models.ProjectVote[];
  }

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
    readonly 'projects': com.bryzek.vote.api.v0.models.Project[];
  }

  interface VoteForm {
    readonly 'code': string;
    readonly 'project_ids': string[];
  }
}

export type CodeVerification = com.bryzek.vote.api.v0.models.CodeVerification;
export type CodeVerificationForm = com.bryzek.vote.api.v0.models.CodeVerificationForm;
export type Event = com.bryzek.vote.api.v0.models.Event;
export type EventReference = com.bryzek.vote.api.v0.models.EventReference;
export type EventStatus = com.bryzek.vote.api.v0.enums.EventStatus;
export type Project = com.bryzek.vote.api.v0.models.Project;
export type ProjectVote = com.bryzek.vote.api.v0.models.ProjectVote;
export type Vote = com.bryzek.vote.api.v0.models.Vote;
export type VoteForm = com.bryzek.vote.api.v0.models.VoteForm;
export type VoterType = com.bryzek.vote.api.v0.enums.VoterType;

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

export interface VotesPostCodeAndVerificationsParameters {
  body: com.bryzek.vote.api.v0.models.CodeVerificationForm;
  headers?: $HttpHeaders;
  event_key: string;
}

export interface VotesPostParameters {
  body: com.bryzek.vote.api.v0.models.VoteForm;
  headers?: $HttpHeaders;
  event_key: string;
}

export type VotesPostCodeAndVerificationsResponse = $HttpOk<com.bryzek.vote.api.v0.models.CodeVerification> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;
export type VotesPostResponse = $HttpOk<com.bryzek.vote.api.v0.models.Vote> | $HttpUnauthorized<com.bryzek.platform.error.v0.models.UnauthorizedError[]> | $HttpUnprocessableEntity<com.bryzek.platform.error.v0.models.ValidationError[]>;

export class VotesResource extends $Resource {
  /*Verify a voting code and return voting information*/
  public postCodeAndVerifications(params: VotesPostCodeAndVerificationsParameters): Promise<VotesPostCodeAndVerificationsResponse> {
    return this.client.request({
      body: params.body,
      endpoint: `/vote/events/${encodeURIComponent(params.event_key)}/code/verifications`,
      headers: params.headers,
      method: 'POST',
    });
  }

  /*Submit votes for projects*/
  public post(params: VotesPostParameters): Promise<VotesPostResponse> {
    return this.client.request({
      body: params.body,
      endpoint: `/vote/events/${encodeURIComponent(params.event_key)}`,
      headers: params.headers,
      method: 'POST',
    });
  }
}

export interface ClientInstance {
  votes: VotesResource;
}

export function createClient(options: $HttpClientOptions): ClientInstance {
  return {
    votes: new VotesResource(options),
  };
}