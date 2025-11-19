-- 기존 유저들의 사번 업데이트 쿼리 (간단한 버전)
-- 사번 형식: 연도 4자리 + 자동 증가 3자리 (예: 2024001, 2024002...)
-- 가입일 기준 연도로 사번 생성

-- MySQL/MariaDB 버전
-- 가입일 순서대로 연도별로 순차 번호 부여
UPDATE users u
INNER JOIN (
    SELECT 
        user_id,
        CONCAT(
            COALESCE(YEAR(user_join_date), YEAR(NOW())),
            LPAD(
                ROW_NUMBER() OVER (
                    PARTITION BY COALESCE(YEAR(user_join_date), YEAR(NOW()))
                    ORDER BY user_join_date ASC, user_id ASC
                ),
                3,
                '0'
            )
        ) AS new_employee_number
    FROM users
    WHERE user_employee_number IS NULL OR user_employee_number = ''
) AS temp ON u.user_id = temp.user_id
SET u.user_employee_number = temp.new_employee_number
WHERE u.user_employee_number IS NULL OR u.user_employee_number = '';

-- 실행 전 확인 쿼리 (사번이 없는 유저 수 확인)
-- SELECT COUNT(*) FROM users WHERE user_employee_number IS NULL OR user_employee_number = '';

-- 실행 후 확인 쿼리 (연도별 사번 분포 확인)
-- SELECT 
--     LEFT(user_employee_number, 4) AS year,
--     COUNT(*) AS count,
--     MIN(user_employee_number) AS min_emp_no,
--     MAX(user_employee_number) AS max_emp_no
-- FROM users
-- WHERE user_employee_number IS NOT NULL
-- GROUP BY LEFT(user_employee_number, 4)
-- ORDER BY year;

