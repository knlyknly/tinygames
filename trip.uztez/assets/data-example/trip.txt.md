# TXT格式说明
1. 当出现日期定义行，且下一行为很多个"="号时，表示一天的行程计划的开始，后续行表示该天的行程计划，以一个空行结束
2. 以五个空格开头的行是上一行的补充说明，应当保留，但不应当被解析
3. "&"符号代表后面的地名为当前地点附近的可选目的地
4. 日期序号并不一定从1d开始，-1d的下一天可能是0d，也可能是1d，取决于原始数据的选择
5. 一个示例的日期行如：-2d w4-0724 247km；其中-2d表示行程开始的前两天；w4表示星期四，0724表示7月24日，247km表示当日总行程247公里
6. 另一个示例的日期行如：d3 w1-0728；d3表示行程开始的第三天；w1表示星期一，0728表示7月28日，没有总行程的日期，程序生成时应当补全
7. 一个示例的地点行如：20:00 折多山↑4298（36km-1h）；其中20:00表示到达的时间，折多山表示地点名称，↑4298表示海拔高度，36km-1h表示距离下一个地点36公里，需要1小时
8. 另一个示例的地点行如：19:00 崇州&望蜀里&川藏线起点(104km-1h)；其中19:00表示到达的时间，崇州表示地点名称，"&望蜀里"和"&川藏线起点"表示附近有两个可选目的地
9. 有时候，两个地点行到达时间的间隔会比较大，明显多于第一行的行程时间，那就说明在第一行会有一段显著的停留时间，时长为二者之差
10. 由于行程表的不确定性，如果所有时间都是整小时为单位的，那么所有的时间都应当以小时为单位，而不精细到分钟
11. 以“ ↓↓↓ ”开头的行是另一种形式的行程计划，等价于地点行后面以括号括起的部分，例如： ↓↓↓  (104km-1h)，程序生成TXT格式的行程时应当始终使用这一格式
# YAML格式说明
1. YAML包含多个数组，每个数组代表一个数据表，在YAML文件中，表名以小写单词表示，例如：locations, destinations, routes, schedule-days, schedule-items
2. 数据表的类型分别为：Location, Destination, Route, ScheduleDay, ScheduleItem
3. Location: 代表地点，包含id, name, altitude, description?, additionDescriptions, latlng?, labels, destinations
4. Destination: 代表目的地，包含id, name, direction, distance
5. Route: 代表路线，包含id, name, startLocationName, endLocationName, distance, durationForward, durationBackward
6. ScheduleDay: 代表行程日，包含id, order, date, scheduleItemIds
7. ScheduleItem: 代表行程项，包含id, order, time, locationId, routeId, destinationId, description, stayTime
  ScheduleItem分为两类，即停留地点和行进路线，停留地点的routeId为null，行进路线的locationId为null
8. 所有的id都是自增的整数