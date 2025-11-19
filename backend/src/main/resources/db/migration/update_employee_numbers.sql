-- 기존 유저들의 사번 업데이트 쿼리
-- 사번 형식: 연도 4자리 + 자동 증가 3자리 (예: 2024001, 2024002...)
-- 가입일 기준 연도로 사번 생성 (가입일이 없으면 현재 연도 사용)

-- MySQL/MariaDB 버전
-- 가입일 기준 연도별로 사번 부여
UPDATE users u1
SET u1.user_employee_number = (
    SELECT CONCAT(
        COALESCE(YEAR(u1.user_join_date), YEAR(NOW())),
        LPAD(
            (
                SELECT COALESCE(MAX(CAST(SUBSTRING(u2.user_employee_number, 5) AS UNSIGNED)), 0) + 1
                FROM users u2
                WHERE u2.user_employee_number IS NOT NULL
                  AND u2.user_employee_number LIKE CONCAT(COALESCE(YEAR(u1.user_join_date), YEAR(NOW())), '%')
                  AND u2.user_id <= u1.user_id
            ),
            3,
            '0'
        )
    )
)
WHERE u1.user_employee_number IS NULL OR u1.user_employee_number = '';

-- 더 간단한 방법: 가입일 순서대로 순차 번호 부여
-- 1단계: 가입일 기준 연도별로 순번 부여 (ROW_NUMBER 사용)
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

-- PostgreSQL 버전 (ROW_NUMBER 사용)
/*
UPDATE users u
SET user_employee_number = CONCAT(
    COALESCE(EXTRACT(YEAR FROM u.user_join_date)::TEXT, EXTRACT(YEAR FROM NOW())::TEXT),
    LPAD(
        ROW_NUMBER() OVER (
            PARTITION BY COALESCE(EXTRACT(YEAR FROM u.user_join_date), EXTRACT(YEAR FROM NOW()))
            ORDER BY u.user_join_date ASC, u.user_id ASC
        )::TEXT,
        3,
        '0'
    )
)
WHERE u.user_employee_number IS NULL OR u.user_employee_number = '';
*/

-- H2 Database 버전 (ROW_NUMBER 사용)
/*
UPDATE users u
SET user_employee_number = CONCAT(
    COALESCE(CAST(YEAR(u.user_join_date) AS VARCHAR), CAST(YEAR(CURRENT_DATE) AS VARCHAR)),
    LPAD(
        CAST(
            ROW_NUMBER() OVER (
                PARTITION BY COALESCE(YEAR(u.user_join_date), YEAR(CURRENT_DATE))
                ORDER BY u.user_join_date ASC, u.user_id ASC
            ) AS VARCHAR
        ),
        3,
        '0'
    )
)
WHERE u.user_employee_number IS NULL OR u.user_employee_number = '';
*/

