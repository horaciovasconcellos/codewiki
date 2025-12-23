SELECT JSON_ARRAYAGG(
         JSON_OBJECT(
            'matricula' VALUE p.emplid,
            'nome'      VALUE n.name,
            'posicao'   VALUE j.position_nbr
         RETURNING CLOB
         )
       RETURNING CLOB
       ) AS funcionarios_json
FROM ps_job j
JOIN ps_personal_data p
  ON p.emplid = j.emplid
LEFT JOIN ps_names n
  ON n.emplid = j.emplid
WHERE j.empl_status = 'A'
  AND j.effdt = (
        SELECT MAX(j2.effdt)
        FROM ps_job j2
        WHERE j2.emplid = j.emplid
          AND j2.empl_rcd = j.empl_rcd
     );

