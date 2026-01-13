DECLARE
   l_from_uom       varchar2(4);
   l_to_uom         varchar2(4);
   l_item_id        number;    
   l_uom_rate       number := 3;
   l_return_status  varchar2(10);
   l_error_code			number;
   l_msg_count			number;
   l_msg_data			  VARCHAR2(255);
   l_item_number    VARCHAR2(40) := 'SU_TEST_UOM_CONV1';      
   l_inventory_item_id		number := 0;
   l_primary_uom          varchar2(20);
   l_from_uom_code        varchar2(20);
   l_to_uom_code          varchar2(20);
BEGIN
   -- Get item information
   BEGIN 
      select distinct msi.inventory_item_id, 
             msi.primary_uom_code
        INTO l_inventory_item_id, 
             l_primary_uom
        FROM mtl_system_items_b msi 
       WHERE segment1 = l_item_number;
   EXCEPTION
      WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Invalid Item');
   END;      
   l_from_uom_code  := 'Lbs';
   l_to_uom_code    := 'G';
          
   -- Intra class  (Within the same UOM class as the Primary UOM's class) 
   -- Source is the Base UOM of the Primary UOM's class
   inv_convert.create_uom_conversion(
        p_from_uom_code  => l_from_uom_code,
        p_to_uom_code => l_to_uom_code,    
        p_item_id =>  l_inventory_item_id ,
        p_uom_rate => 0.1,
        x_return_status => l_return_status 
        );      

   if (x_return_status <> fnd_api.g_ret_sts_success) 
   then
      dbms_output.put_line('Error Message Count :'||fnd_msg_pub.count_msg);
      x_msg_count := fnd_msg_pub.count_msg; 
      for cnt in 1..x_msg_count 
      loop
         dbms_output.put_line('Index: '||cnt||' Error Message :'||fnd_msg_pub.get(cnt, 'T'));
      end loop;
   end if;     
END;     
