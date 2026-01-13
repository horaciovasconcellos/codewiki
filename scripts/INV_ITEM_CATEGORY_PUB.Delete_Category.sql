DECLARE
   l_return_status VARCHAR2(80);
   l_error_code    NUMBER;
   l_msg_count     NUMBER;
   l_msg_data      VARCHAR2(80);
   l_category_id   NUMBER;
BEGIN
   SELECT mcb.CATEGORY_ID
     INTO l_category_id
     FROM mtl_categories_b      mcb,
          mtl_category_sets_b   mcs_b,
          mtl_category_sets_tl  mcs_tl
    WHERE mcb.SEGMENT1 = 'SOFA'
      AND mcb.STRUCTURE_ID = mcs_b.STRUCTURE_ID
      AND mcs_b.CATEGORY_SET_ID = mcs_tl.CATEGORY_SET_ID
      AND mcs_tl.CATEGORY_SET_NAME = 'HOME INTERIOR';
    --Call INV_ITEM_CATEGORY_PUB.Delete_Category api
    INV_ITEM_CATEGORY_PUB.Delete_Category
          (
          p_api_version     => 1.0,
          p_init_msg_list   => FND_API.G_FALSE,
          p_commit          => FND_API.G_TRUE,
          x_return_status   => l_return_status,
          x_errorcode       => l_error_code,
          x_msg_count       => l_msg_count,
          x_msg_data        => l_msg_data,
          p_category_id     => l_category_id);
 
  IF l_return_status = fnd_api.g_ret_sts_success 
  THEN
     COMMIT;
     DBMS_OUTPUT.put_line ('Delete of Item Categoryis Successful: '||l_category_id);
  ELSE
    DBMS_OUTPUT.put_line ('tem Category Removal Failed with error :'||l_error_code);
    ROLLBACK;
  END IF;
END;
