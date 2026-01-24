import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * 암호화 키를 안전하게 가져옵니다.
 * 환경 변수가 설정되지 않은 경우 에러를 발생시킵니다.
 */
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      'ENCRYPTION_KEY 환경 변수가 설정되지 않았습니다. ' +
      '.env.local 파일에 ENCRYPTION_KEY를 설정해주세요.'
    );
  }
  return key;
}

/**
 * 데이터를 AES-256-GCM으로 암호화
 * @param plaintext 평문 데이터
 * @returns Base64 인코딩된 암호문 (iv + authTag + ciphertext)
 */
export function encryptData(plaintext: string): string {
  const encryptionKey = getEncryptionKey();

  // 키를 32바이트로 해시
  const key = crypto.createHash('sha256').update(encryptionKey).digest();

  // 랜덤 IV 생성
  const iv = crypto.randomBytes(IV_LENGTH);

  // 암호화
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Auth tag 가져오기
  const authTag = cipher.getAuthTag();

  // IV + AuthTag + Ciphertext를 Base64로 인코딩
  const combined = Buffer.concat([
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);

  return combined.toString('base64');
}

/**
 * AES-256-GCM으로 암호화된 데이터 복호화
 * @param encryptedData Base64 인코딩된 암호문
 * @returns 복호화된 평문
 */
export function decryptData(encryptedData: string): string {
  const encryptionKey = getEncryptionKey();

  // 키를 32바이트로 해시
  const key = crypto.createHash('sha256').update(encryptionKey).digest();

  // Base64 디코딩
  const combined = Buffer.from(encryptedData, 'base64');

  // IV, AuthTag, Ciphertext 분리
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  // 복호화
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * 주민등록번호를 SHA-256으로 해시 (중복 체크용)
 * 솔트를 사용하여 레인보우 테이블 공격을 방지합니다.
 * @param ssn 주민등록번호 (13자리)
 * @returns 해시값
 */
export function hashSSN(ssn: string): string {
  // 환경 변수 기반 솔트 사용 (미설정시 기본값 사용)
  const salt = process.env.SSN_HASH_SALT || 'signplease-ssn-salt-v1';
  
  // 주민번호 앞 7자리 + 솔트로 해시 (생년월일 + 성별)
  const partialSSN = ssn.substring(0, 7);
  return crypto
    .createHmac('sha256', salt)
    .update(partialSSN)
    .digest('hex');
}

/**
 * 주민등록번호 마스킹
 * @param ssn 주민등록번호
 * @returns 마스킹된 주민등록번호 (예: 990101-1******)
 */
export function maskSSN(ssn: string): string {
  if (ssn.length !== 13) return ssn;
  return ssn.substring(0, 7) + '******';
}

/**
 * 계좌번호 마스킹
 * @param accountNumber 계좌번호
 * @returns 마스킹된 계좌번호 (앞 3자리 + **** + 뒤 3자리)
 */
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 7) return accountNumber;
  const front = accountNumber.substring(0, 3);
  const back = accountNumber.substring(accountNumber.length - 3);
  return `${front}****${back}`;
}
