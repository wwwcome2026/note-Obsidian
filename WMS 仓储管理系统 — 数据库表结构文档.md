## 1. wms_cargo_owners — 货主信息表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|owner_code|货主编码（唯一）|varchar(32)|是|—|
|owner_name|货主名称|varchar(100)|是|—|
|country|国家|varchar(50)|是|—|
|city|城市|varchar(50)|是|—|
|address|地址|varchar(200)|是|—|
|postal_code|邮编|varchar(32)|是|—|
|email|邮箱|varchar(32)|是|—|
|phone|电话|varchar(32)|是|—|
|legal_person|法人代表|varchar(32)|是|—|
|contact_person|联系人|varchar(32)|是|—|
|contact_phone|联系人电话|varchar(50)|是|—|
|license_number|许可证号码|varchar(32)|是|—|
|license_valid_date|许可证有效期|date|是|—|
|license_attachment|许可证附件|varchar(255)|是|—|
|usci|统一社会信用代码|varchar(50)|是|—|
|business_license_attachment|营业执照附件路径|varchar(255)|是|—|
|settlement_currency|结算币种|varchar(32)|是|—|
|remarks|备注|varchar(32)|是|—|
|status|状态|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

> **唯一约束**：`owner_code`

---

## 2. wms_carrier — 承运商信息表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|carrier_code|承运商编码|varchar(32)|否|—|
|carrier_name|承运商名称|varchar(32)|否|—|
|carrier_type|类型|varchar(32)|是|—|
|contact_person|联系人|varchar(32)|是|—|
|contact_phone|联系电话|varchar(32)|是|—|
|contact_email|邮箱|varchar(32)|是|—|
|address|地址|varchar(32)|是|—|
|country|国家|varchar(32)|是|—|
|province|省|varchar(32)|是|—|
|city|市|varchar(32)|是|—|
|postal_code|邮政编码|varchar(32)|是|—|
|tax_id|税号|varchar(32)|是|—|
|bank_account|银行账号|varchar(32)|是|—|
|bank_name|开户行|varchar(32)|是|—|
|account_holder|账户持有人|varchar(32)|是|—|
|status|状态|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 3. wms_inventory — 库存表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|product_id|商品ID|varchar(32)|否|—|
|location_code|储位编码|varchar(32)|否|—|
|container_code|容器编码|varchar(32)|是|—|
|stock_quantity|在库数量|int|否|—|
|allocated_quantity|分配数量|int|是|—|
|available_quantity|可用数量|int|是|—|
|batch_number|批号|varchar(32)|否|''|
|stock_in_time|入库时间|datetime|否|—|
|expiry_date|保质期到期日|date|是|—|
|owner_id|货主|varchar(32)|是|—|
|is_sellable|是否可售|varchar(32)|是|—|
|warehouse_id|仓库ID|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

> **唯一约束**：`product_id` + `location_code` + `batch_number`

---

## 4. wms_inventory_trans — 库存变更流水表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|product_id|商品ID|varchar(32)|否|—|
|location_code|储位编码|varchar(32)|否|—|
|container_code|容器编码|varchar(32)|是|—|
|change_quantity|变更数量|int|否|—|
|transaction_type|变更类型|varchar(32)|否|—|
|reference_number|关联单据号|varchar(32)|是|—|
|remarks|备注|varchar(512)|是|—|
|transaction_time|变更时间|datetime|否|—|
|batch_number|批次号|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 5. wms_iot_alert_log — IoT 报警日志表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|rule_id|报警规则ID|varchar(36)|是|—|
|rule_name|报警规则名称|varchar(32)|是|—|
|rule_info|报警规则|varchar(100)|是|—|
|alert_level|报警级别|varchar(32)|是|—|
|device_code|关联设备编码|varchar(32)|是|—|
|device_name|关联设备|varchar(32)|是|—|
|alert_data|异常数据|double(10,0)|是|—|
|process_status|处理进度|varchar(32)|是|—|
|process_time|处理时间|varchar(32)|是|—|
|process_plan|处理方案|text|是|—|
|alert_time|报警时间|datetime|是|—|
|notify_info|通知信息|text|是|—|
|remark|备注|text|是|—|
|product_name|所属产品|varchar(32)|是|—|
|warehouse_name|所属仓库|varchar(32)|是|—|
|model_code|物模型编码|varchar(32)|是|—|
|product_code|产品编码|varchar(32)|是|—|
|tenant_id|租户ID|int|是|—|

---

## 6. wms_iot_alert_rule — IoT 报警规则表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建时间|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|alert_name|报警规则名称|varchar(32)|是|—|
|product_code|产品编码|varchar(32)|是|—|
|product_name|所属产品|varchar(32)|是|—|
|device_code|设备编码|varchar(32)|是|—|
|device_name|关联设备|varchar(32)|是|—|
|model_code|指标编码|varchar(32)|是|—|
|model_name|监控指标|varchar(32)|是|—|
|alert_level|报警级别|varchar(32)|是|—|
|operator|运算符|varchar(32)|是|—|
|threshold|阈值|double(10,0)|是|—|
|cycle|连续周期|varchar(32)|是|'1'|
|ignore_duration|沉默周期|varchar(32)|是|'300'|
|is_enable|启用/禁用|varchar(32)|是|'1'|
|notify_type|通知方式|text|是|—|
|tenant_id|租户ID|int|是|—|
|warehouse_name|所属仓库|varchar(32)|是|—|

---

## 7. wms_iot_device — IoT 设备表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|device_name|设备名称|varchar(32)|是|—|
|device_code|设备编码|varchar(32)|是|—|
|product_code|产品编号|varchar(32)|是|—|
|is_enable|启用/禁用|varchar(32)|是|'1'|
|remark|设备备注|text|是|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|product_name|所属产品|varchar(32)|是|—|
|device_status|设备状态|int|是|-1|
|warehouse_code|仓库编码|varchar(32)|是|—|
|warehouse_name|所属仓库|varchar(32)|是|—|
|ip_addr|IP地址|varchar(32)|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|tenant_id|租户ID|int|是|—|

---

## 8. wms_iot_monitor_config — IoT 监控配置表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|product_code|产品编码|varchar(32)|是|—|
|product_name|产品名称|varchar(32)|是|—|
|device_code|设备编码|varchar(32)|是|—|
|device_name|设备名称|varchar(32)|是|—|
|model_code|物模型编码|varchar(32)|是|—|
|model_name|物模型名称|varchar(32)|是|—|
|unit|单位|varchar(32)|是|—|
|tenant_id|租户ID|int|是|—|
|device_with_warehouse_name|设备及仓库名|varchar(100)|是|—|

---

## 9. wms_iot_product — IoT 产品表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|product_name|产品名称|varchar(32)|是|—|
|product_code|产品编码|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|create_by|创建人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|product_desc|产品描述|text|是|—|
|auth_type|认证方式|varchar(50)|是|'password'|
|node_type|节点类型|varchar(32)|是|'direct'|
|network_mode|连网方式|varchar(32)|是|'ethernet'|
|image_url|产品图片|varchar(100)|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|tenant_id|租户ID|int|是|—|

---

## 10. wms_iot_product_model — IoT 产品物模型表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|model_name|功能名称|varchar(32)|否|—|
|code|功能编码|varchar(50)|否|—|
|type|功能类型|varchar(32)|否|—|
|product_code|产品编码|varchar(32)|是|—|
|command|指令|varchar(200)|是|—|
|need_extra_arg|是否传参|int|是|—|
|arg_type|参数类型|varchar(32)|是|—|
|model_desc|功能描述|text|是|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建时间|datetime|是|—|
|update_time|更新日期|datetime|是|—|
|unit|单位|varchar(32)|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|tenant_id|租户ID|int|是|—|

---

## 11. wms_out_orders — 出库单主表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|order_no|出库单号|varchar(32)|否|—|
|order_type|出库类型|varchar(32)|否|—|
|order_source|订单来源|varchar(32)|否|—|
|order_source_no|来源单号|varchar(32)|是|—|
|warehouse_id|仓库ID|varchar(32)|是|—|
|owner_id|货主ID|varchar(32)|是|—|
|customer_id|客户ID|varchar(32)|是|—|
|expected_ship_time|预计发货时间|datetime|是|—|
|actual_ship_time|实际发货时间|datetime|是|—|
|total_quantity|总商品数量|int|是|—|
|total_sku|总SKU种类数|int|是|—|
|total_weight|总重量|int|是|—|
|total_volume|总体积|int|是|—|
|carrier_code|承运商编码|varchar(32)|是|—|
|consignee|收货人|varchar(32)|是|—|
|shipping_time|收货时间|datetime|是|—|
|shipping_address|收货地址|varchar(256)|是|—|
|contact|联系方式|varchar(32)|是|—|
|status|状态|varchar(32)|否|—|
|remark|备注|varchar(512)|是|—|
|wave_id|波次ID|varchar(32)|是|—|
|created_waybill|是否创建运单|varchar(32)|是|'0'|
|shipment_strategy|包裹策略|varchar(32)|是|—|
|shipping_province|收件人省|varchar(32)|是|—|
|shipping_city|收件人市|varchar(32)|是|—|
|shipping_county|收件人县区|varchar(32)|是|—|
|region|省市区编码|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

> **索引**：`index_status_createdwaybill` (status, created_waybill)

---

## 12. wms_out_orders_allocation — 出库分配明细表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|order_id|出库单ID|varchar(32)|否|—|
|order_item_id|出库单明细ID|varchar(32)|否|—|
|sku_id|商品ID|varchar(32)|否|—|
|location_code|储位编号|varchar(32)|否|—|
|batch_number|批次号|varchar(32)|是|—|
|container_code|容器编号|varchar(32)|是|—|
|allocated_quantity|分配数量|int|否|—|
|picked_quantity|拣货数量|int|是|—|
|inventory_id|库存ID|varchar(32)|否|—|
|status|状态|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 13. wms_out_orders_items — 出库单明细表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|order_id|出库单ID|varchar(32)|否|—|
|sku_id|商品ID|varchar(32)|否|—|
|expected_quantity|预期出库数量|int|否|0|
|allocated_quantity|分配数量|int|是|0|
|picked_quantity|拣货数量|int|是|0|
|packed_quantity|打包数量|int|是|0|
|batch_number|批次号|varchar(32)|是|—|
|expiry_date|保质期|date|是|—|
|status|状态|varchar(32)|否|—|
|tenant_id|租户ID|int|是|0|

---

## 14. wms_packaging_material — 包材信息表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|material_code|编号|varchar(32)|是|—|
|material_type|包材类型|varchar(32)|是|—|
|material_name|包材名称|varchar(32)|是|—|
|owner_id|货主ID|varchar(32)|是|—|
|length|长|double|是|—|
|width|宽|double|是|—|
|height|高|double|是|—|
|volume|体积|double|是|—|
|weight|重量|double|是|—|
|status|状态|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 15. wms_product_brand — 商品品牌表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|name|品牌名称|varchar(128)|否|—|
|logo|品牌Logo|varchar(128)|是|—|
|status|状态|varchar(32)|否|—|
|tenant_id|租户ID|int|是|0|

---

## 16. wms_product_categories — 商品分类表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|category_name|类别名称|varchar(50)|否|—|
|parent_id|父节点|varchar(32)|否|—|
|status|状态|varchar(32)|否|—|
|has_child|是否有子节点|varchar(3)|是|—|
|category_code|节点编码|varchar(32)|否|—|
|tenant_id|租户ID|int|是|0|

---

## 17. wms_product_images — 商品图片表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|product_id|商品ID|varchar(32)|是|—|
|original|原始图片地址|varchar(255)|是|—|
|is_default|是否默认图片|varchar(1)|是|—|
|small|小图路径|varchar(255)|是|—|
|thumbnail|缩略图路径|varchar(255)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 18. wms_products — 商品信息表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|product_name|商品名称|varchar(100)|否|—|
|owner_id|货主ID|varchar(32)|否|—|
|product_code|商品编码|varchar(64)|是|—|
|product_barcode|商品条码|varchar(64)|是|—|
|width|宽|double(10,0)|是|—|
|length|长|double(10,0)|是|—|
|height|高|double(10,0)|是|—|
|volume|体积|double(10,0)|是|—|
|gross_weight|毛重|double(10,0)|是|—|
|net_weight|净重|double(10,0)|是|—|
|category_id|商品一级分类ID|varchar(32)|是|—|
|packaging_spec|包装规格|varchar(100)|是|—|
|maintenance_cycle|养护周期（天）|int|是|—|
|shelf_life|保质期（天）|int|是|—|
|unit|计量单位|varchar(32)|是|—|
|is_expiry_controlled|是否保质期管控|int|是|—|
|status|状态|varchar(32)|是|—|
|supplier_barcode|供应商条码|varchar(50)|是|—|
|product_batch|商品批次|varchar(32)|是|—|
|product_spec|商品规格|varchar(64)|是|—|
|product_brand|商品品牌|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

> **唯一约束**：`owner_id` + `product_code`；`product_barcode`

---

## 19. wms_products_batchnum — 商品批次号表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|owner_id|货主ID|varchar(32)|否|—|
|batch_number|批次号|varchar(32)|否|—|
|tenant_id|租户ID|int|是|0|

> **唯一约束**：`batch_number`

---

## 20. wms_shipment — 包裹/运单表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|shipment_no|包裹编码|varchar(32)|否|—|
|order_id|出库单ID|varchar(32)|否|—|
|wave_id|波次ID|varchar(32)|是|—|
|shipment_type|包裹类型|varchar(32)|否|—|
|carrier_id|承运商ID|varchar(32)|是|—|
|tracking_no|物流单号|varchar(32)|是|—|
|packaging_id|包材ID|varchar(32)|是|—|
|total_weight|总重量|double(10,0)|是|—|
|weight_unit|重量单位|varchar(32)|是|—|
|size_length|长|double(10,0)|是|—|
|size_width|宽|double(10,0)|是|—|
|size_height|高|double(10,0)|是|—|
|size_unit|尺寸单位|varchar(32)|是|—|
|total_volume|总体积|double(10,0)|是|—|
|volume_unit|体积单位|varchar(32)|是|—|
|package_count|包裹件数|int|是|—|
|from_address|送货地址|varchar(255)|是|—|
|to_address|收货地址|varchar(255)|是|—|
|contact|联系方式|varchar(32)|是|—|
|estimated_arrival|预计到达时间|datetime|是|—|
|actual_departure|实际发货时间|datetime|是|—|
|actual_arrival|实际到达时间|datetime|是|—|
|status|状态|varchar(32)|是|—|
|packer_id|打包人|varchar(32)|是|—|
|shipper_id|发货人|varchar(32)|是|—|
|waybill_pdf|运单PDF|varchar(128)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 21. wms_shipment_detail — 包裹明细表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|shipment_id|包裹ID|varchar(32)|否|—|
|order_id|出库单ID|varchar(32)|否|—|
|order_item_id|出库单明细ID|varchar(32)|否|—|
|sku_id|商品ID|varchar(32)|否|—|
|quantity|数量|int|是|—|
|tenant_id|租户ID|int|是|0|

---

## 22. wms_shortage_registration — 缺货登记表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|wave_id|波次ID|varchar(32)|是|—|
|wave_sku_summary_id|波次拣货明细ID|varchar(32)|是|—|
|task_id|关联任务ID|varchar(32)|是|—|
|product_id|商品ID|varchar(32)|是|—|
|source_location_code|储位编码|varchar(32)|是|—|
|batch_number|批次号|varchar(32)|是|—|
|shortage_quantity|缺货数量|int|是|—|
|status|状态（待处理/已补货/已取消）|varchar(32)|是|—|
|process_method|处理方式（补货/换货/取消）|varchar(32)|是|—|
|processor|处理人|varchar(32)|是|—|
|process_time|处理时间|datetime|是|—|
|process_remark|处理备注|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 23. wms_stock_in_order_items — 入库单明细表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|order_id|入库单ID|varchar(32)|是|—|
|product_id|商品ID|varchar(32)|是|—|
|expected_quantity|采购数量|int|是|0|
|received_quantity|实际收货数量|int|是|0|
|shelved_quantity|上架数量|int|是|0|
|defective_quantity|不良品数量|int|是|0|
|remarks|备注|varchar(255)|是|—|
|status|状态|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

> **唯一约束**：`order_id` + `product_id`

---

## 24. wms_stock_in_orders — 入库单主表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|order_number|入库单号|varchar(50)|是|—|
|order_type|入库类型|varchar(32)|是|—|
|source_number|来源单号|varchar(50)|是|—|
|owner_id|货主ID|varchar(32)|是|—|
|expected_arrival_time|预计到货时间|datetime|是|—|
|status|状态|varchar(32)|是|—|
|remarks|备注|varchar(500)|是|—|
|total_expected_quantity|预期总数量（冗余字段）|int|是|—|
|total_received_quantity|实际收货总量|int|是|—|
|total_shelved_quantity|已上架总量|int|是|—|
|total_defective_quantity|不良品总数量（冗余字段）|int|是|—|
|warehouse_id|仓库|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 25. wms_storage_locations — 储位信息表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|location_code|库位编码|varchar(50)|否|—|
|location_category|储位类别|varchar(100)|否|—|
|location_type|库位类型|varchar(50)|否|—|
|status|状态|varchar(32)|否|—|
|zone_id|所属库区|varchar(32)|否|—|
|location_aisle|巷道|varchar(32)|是|—|
|location_line|排|varchar(32)|是|—|
|location_rank|列|varchar(32)|是|—|
|location_layer|层|varchar(32)|是|—|
|location_length|长|double(10,0)|是|—|
|location_width|宽|double(10,0)|是|—|
|location_capacity|容积|double(10,0)|是|—|
|load_capacity|承重|double(10,0)|是|—|
|is_sellable|是否可售|varchar(32)|否|—|
|warehouse_id|所属仓库|varchar(32)|否|—|
|tenant_id|租户ID|int|是|0|

---

## 26. wms_storage_zones — 库区信息表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|zone_code|库区编码|varchar(50)|否|—|
|zone_name|库区名称|varchar(100)|否|—|
|zone_type|库区类型|varchar(50)|否|—|
|status|状态（创建/禁用/启用）|varchar(32)|否|—|
|is_sellable|是否可售库存（0-否, 1-是）|varchar(1)|是|—|
|warehouse_id|所属仓库|varchar(32)|否|—|
|tenant_id|租户ID|int|是|0|

---

## 27. wms_tasks — 作业任务表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|task_number|任务号|varchar(32)|是|—|
|task_type|任务类型|varchar(32)|是|—|
|task_status|任务状态|varchar(32)|是|—|
|product_id|商品ID|varchar(32)|是|—|
|quantity|数量|int|是|—|
|completed_quantity|完成数量|int|是|—|
|source_location_code|来源储位编码|varchar(32)|是|—|
|target_location_code|目的储位编码|varchar(32)|是|—|
|source_container_code|来源容器编码|varchar(32)|是|—|
|target_container_code|目的容器编码|varchar(32)|是|—|
|operator|执行人|varchar(32)|是|—|
|operation_time|执行时间|datetime|是|—|
|completed_at|完成时间|datetime|是|—|
|stock_in_order_id|入库单ID|varchar(32)|是|—|
|stock_in_order_item_id|入库明细ID|varchar(32)|是|—|
|wave_order_id|波次单ID|varchar(32)|是|—|
|batch_number|批次号|varchar(32)|是|—|
|expiry_date|保质期|date|是|—|
|out_order_id|出库单ID|varchar(32)|是|—|
|wave_sku_summary_id|波次拣货明细ID|varchar(32)|是|—|
|target_warehouse_id|目的仓库|varchar(32)|是|—|
|source_warehouse_id|来源仓库|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 28. wms_tasks_records — 任务执行记录表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|task_number|任务号|varchar(32)|是|—|
|task_type|任务类型|varchar(32)|是|—|
|product_id|商品ID|varchar(32)|是|—|
|exec_quantity|执行数量|int|是|—|
|source_location_code|来源储位编码|varchar(32)|是|—|
|target_location_code|目的储位编码|varchar(32)|是|—|
|source_container_code|来源容器编码|varchar(32)|是|—|
|target_container_code|目的容器编码|varchar(32)|是|—|
|operator|执行人|varchar(32)|是|—|
|operation_time|执行时间|datetime|是|—|
|stock_in_order_id|入库单ID|varchar(32)|是|—|
|stock_in_order_item_id|入库明细ID|varchar(32)|是|—|
|wave_order_id|波次单ID|varchar(32)|是|—|
|inventory_attribute|库存属性|varchar(32)|是|—|
|task_id|任务ID|varchar(32)|是|—|
|batch_number|批次号|varchar(32)|是|—|
|expiry_date|保质期|date|是|—|
|out_order_id|出库单ID|varchar(32)|是|—|
|wave_sku_summary_id|波次拣货明细ID|varchar(32)|是|—|
|target_warehouse_id|目的仓库|varchar(32)|是|—|
|source_warehouse_id|来源仓库|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

---

## 29. wms_warehouses — 仓库信息表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|warehouse_code|仓库代码|varchar(50)|否|—|
|warehouse_name|仓库名称|varchar(100)|否|—|
|warehouse_attr|仓库属性|varchar(50)|否|—|
|status|状态（创建/启动/禁用）|varchar(32)|是|—|
|tenant_id|租户ID|int|是|—|

---

## 30. wms_wave_master — 波次主表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|wave_no|波次编号|varchar(32)|否|—|
|warehouse_id|仓库ID|varchar(32)|是|—|
|zone_id|储区ID|varchar(32)|是|—|
|wave_rule_id|波次策略|varchar(32)|否|—|
|total_orders|订单数量|int|否|—|
|total_items|SKU种类数量|int|否|—|
|status|状态|varchar(32)|否|—|
|remark|备注|varchar(32)|是|—|
|total_skus|SKU数量|int|否|—|
|picked_quantity|拣货数量|int|是|0|
|sorting_quantity|分拣数量|int|是|0|
|sorting_order_quantity|分拣订单数|int|是|0|
|tenant_id|租户ID|int|是|0|
|pick_path|拣货路径|text|是|—|
|pick_path_img|拣货路径图片|text|是|—|

---

## 31. wms_wave_sku_summary — 波次拣货明细表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|wave_id|波次ID|varchar(32)|否|—|
|sku_id|商品ID|varchar(32)|否|—|
|owner_id|货主ID|varchar(32)|否|—|
|product_barcode|商品条码|varchar(32)|是|—|
|location_code|储位编码|varchar(32)|否|—|
|batch_number|批次号|varchar(32)|是|—|
|container_code|容器编码|varchar(32)|是|—|
|allocated_quantity|分配数量|int|否|—|
|picked_quantity|拣货数量|int|否|0|
|status|状态|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|

> **索引**：`wms_wave_sku_summary__unique1` (owner_id, sku_id, batch_number)

---

## 32. wms_wave_strategy — 波次策略表

|字段名|说明|类型|可空|默认值|
|---|---|---|---|---|
|id|主键|varchar(36)|否|—|
|create_by|创建人|varchar(50)|是|—|
|create_time|创建日期|datetime|是|—|
|update_by|更新人|varchar(50)|是|—|
|update_time|更新日期|datetime|是|—|
|sys_org_code|所属部门|varchar(64)|是|—|
|strategy_name|策略名称|varchar(32)|否|—|
|strategy_code|策略编码|varchar(32)|否|—|
|priority|优先级|int|否|—|
|min_order_count|最小订单数|int|否|0|
|max_order_count|最大订单数|int|否|0|
|min_sku_items|最小SKU品项数|int|否|0|
|max_sku_items|最大SKU品项数|int|否|0|
|min_sku_quantity|最小SKU件数|int|否|0|
|max_sku_quantity|最大SKU件数|int|否|0|
|is_auto_execute|是否自动执行|varchar(32)|是|'0'|
|group_by_owner|是否按货主分组|varchar(32)|是|'0'|
|group_by_carrier|是否按承运商分组|varchar(32)|是|'0'|
|storage_area_code|储区编码|varchar(32)|是|—|
|storage_area_name|储区名称|varchar(32)|是|—|
|max_storage_areas|波次内最大储区数|int|是|0|
|min_sku_per_order|单订单最小SKU数|int|是|0|
|max_sku_per_order|单订单最大SKU数|int|是|0|
|is_enabled|是否启用|varchar(32)|否|'0'|
|remark|备注|varchar(32)|是|—|
|tenant_id|租户ID|int|是|0|