import React from "react";
import { addDataToMap } from "kepler.gl/actions";
import { processGeojson } from "kepler.gl/processors";
import { useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import store from "./store";
import { removeDataset } from "kepler.gl/dist/actions/vis-state-actions";

export default function Dispatcher(data: any) {
  const dispatch = useDispatch();
  const kgl: any = store.getState().keplerGl;
  React.useEffect(() => {
    // // If there is a dataset, delete it
    if (kgl.theMap) {
      let kglKeys = Object.keys(kgl.theMap.visState.datasets);
      if (kglKeys.length > 0) {
        for (let datasetkey of kglKeys) {
          dispatch(removeDataset(datasetkey));
        }
      }
    }

    if (data) {
      dispatch(
        addDataToMap({
          datasets: {
            info: {
              label: uuidv4(),
            },
            data: processGeojson(data),
          },
          option: {
            centerMap: true,
            readOnly: false,
          },
          config: {},
        })
      );
    }
  }, [dispatch, data]);
}
