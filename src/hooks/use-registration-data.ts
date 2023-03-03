import { useQuery } from "preact-fetching";
import { useContext } from "preact/hooks";
import { ReportFilterContext } from "../contexts/report-filter-context";
import { loadData } from "../models/daily-registrations-report-data";

interface RegistrationDataOptions {
  start: Date;
  finish: Date;
}

function useRegistrationData({ start, finish }: RegistrationDataOptions) {
  const { env } = useContext(ReportFilterContext);
  const { data } = useQuery(`daily-registrations-${finish.valueOf()}`, () => loadData(finish, env));

  return data?.filter((entry) => entry.date >= start && entry.date <= finish);
}

export default useRegistrationData;
