DECLARE
   l_category_rec    INV_ITEM_CATEGORY_PUB.CATEGORY_REC_TYPE;
   l_return_status   VARCHAR2(80);
   l_error_code      NUMBER;
   l_msg_count       NUMBER;
   l_msg_data        VARCHAR2(80);
   l_category_id NUMBER;
BEGIN
   l_category_rec.segment1 := 'SOFA';
   l_category_rec.segment2 := 'MED';
  SELECT f.ID_FLEX_NUM
    INTO l_category_rec.structure_id
    FROM FND_ID_FLEX_STRUCTURES f
   WHERE f.ID_FLEX_STRUCTURE_CODE = 'HOME_INT';
 
  l_category_rec.description := 'Medium Size Sofa';
 
  INV_ITEM_CATEGORY_PUB.Create_Category
          (
          p_api_version   => 1.0,
          p_init_msg_list => FND_API.G_FALSE,
          p_commit        => FND_API.G_TRUE,
          x_return_status => l_return_status,
          x_errorcode     => l_error_code,
          x_msg_count     => l_msg_count,
          x_msg_data      => l_msg_data,
          p_category_rec  => l_category_rec,
          x_category_id   => l_category_id
          );
  IF l_return_status = fnd_api.g_ret_sts_success THEN
    COMMIT;
    DBMS_OUTPUT.put_line ('Item Category Creation is Successful: '||l_category_id);
  ELSE
    DBMS_OUTPUT.put_line ('Item Category Creation Failed with the error :'||l_error_code);
    ROLLBACK;
  END IF;
END ;
